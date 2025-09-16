import subprocess
import time
from dataclasses import dataclass
from pathlib import Path

import click
import requests
from keycloak import KeycloakAdmin, KeycloakPostError

from aoc_cli.env.config import (
    BITSWAN_BACKEND_DOCKER_ENV_FILE,
    KEYCLOAK_ENV_FILE,
    OPERATIONS_CENTRE_DOCKER_ENV_FILE,
    Environment,
)
from aoc_cli.env.utils import get_env_path
from aoc_cli.utils.env import get_env_value


@dataclass
class KeycloakConfig:
    admin_username: str
    admin_password: str
    aoc_dir: Path
    server_url: str
    realm_name: str = "master"
    management_url: str = "http://localhost:9000"
    verify: bool = False
    org_name: str = "Example Org"
    env: Environment = Environment.DEV
    keycloak_smtp_username: str | None = None
    keycloak_smtp_password: str | None = None
    keycloak_smtp_host: str | None = None
    keycloak_smtp_from: str | None = None
    keycloak_smtp_port: str | None = None
    
    def __post_init__(self):
        # Use localhost for development to avoid DNS resolution issues with .localhost domains
        if self.env == Environment.DEV:
            self.management_url = "http://localhost:9000"
            self.verify = False


class KeycloakService:
    def __init__(self, config: KeycloakConfig):
        self.config = config
        self.keycloak_admin = None

    def setup(self) -> None:
        self.start_services()
        self.wait_for_service()
        self.connect()
        self.configure_realm_settings()
        client_secrets = self.create_clients()
        self.setup_bitswan_backend_client()
        self.initialize_admin_user()
        self.update_realm_smtp_server()

        self.update_envs_with_keycloak_secret(client_secrets)
        click.echo("✓ Keycloak setup complete")

    def configure_realm_settings(self) -> None:
        realm = self.keycloak_admin.get_realm(self.config.realm_name)

        realm["ssoSessionMaxLifespan"] = 2073600000

        self.keycloak_admin.update_realm(self.config.realm_name, realm)
        click.echo("✓ Realm settings configured")

    def start_services(self) -> None:
        subprocess.run(
            [
                "docker",
                "compose",
                "-f",
                (
                    "docker-compose.yml"
                ),
                "up",
                "-d",
                "keycloak",
                "keycloak-postgres",
            ],
            cwd=self.config.aoc_dir,
            check=True,
            shell=False,
            stdout=subprocess.DEVNULL,
        )

    def setup_bitswan_backend_client(self) -> None:
        clients = self.keycloak_admin.get_clients()
        bitswan_backend_client = next(
            (client for client in clients if client["clientId"] == "bitswan-backend"),
            None,
        )
        master_realm_client = next(
            (client for client in clients if client["clientId"] == "master-realm"), None
        )
        if not bitswan_backend_client or not master_realm_client:
            raise ValueError("Bitswan backend or master realm client not found")

        bitswan_backend_client_id = bitswan_backend_client.get("id")
        master_realm_client_id = master_realm_client.get("id")

        self.keycloak_admin.update_client_management_permissions(
            {"enabled": True}, bitswan_backend_client_id
        )

        resources = self.keycloak_admin.get_client_authz_resources(
            bitswan_backend_client_id
        )
        default_resource = next(
            (
                resource
                for resource in resources
                if resource["name"] == "Default Resource"
            ),
            None,
        )

        if not default_resource:
            raise ValueError("Default resource not found")

        policy = {
            "name": "default-token-exchange-policy",
            "type": "client",
            "logic": "POSITIVE",
            "decisionStrategy": "UNANIMOUS",
            "clients": [bitswan_backend_client_id],
        }

        policy = self.keycloak_admin.create_client_authz_client_policy(
            policy, master_realm_client_id
        )

        scopes = self.keycloak_admin.get_client_authz_scopes(master_realm_client_id)
        token_exchange_scope = next(
            (scope for scope in scopes if scope["name"] == "token-exchange"), None
        )

        if not token_exchange_scope:
            raise ValueError("Token exchange scope not found in permissions")

        permission = {
            "name": "bitswan-backend-token-exchange",
            "description": "Allow bitswan-backend to exchange tokens",
            "type": "scope",
            "logic": "POSITIVE",
            "decisionStrategy": "UNANIMOUS",
            "policies": [policy["id"]],
            "resources": [default_resource["_id"]],
            "scopes": [token_exchange_scope["id"]],
        }

        self.keycloak_admin.create_client_authz_scope_permission(
            permission, bitswan_backend_client_id
        )

        offline_scope = self.keycloak_admin.get_client_scope_by_name("offline_access")
        if offline_scope:
            self.keycloak_admin.delete_client_optional_client_scope(
                bitswan_backend_client_id, offline_scope["id"]
            )
            payload = {
                "realm": self.config.realm_name,
                "client": bitswan_backend_client_id,
                "clientScopeId": offline_scope["id"],
            }
            self.keycloak_admin.add_client_default_client_scope(
                bitswan_backend_client_id, offline_scope["id"], payload
            )

        else:
            raise ValueError(
                "Error durring bitswan backend client setup - offline scope not found"
            )

        click.echo("✓ Bitswan backend client setup complete")

    def wait_for_service(self, max_retries: int = 30, delay: int = 10) -> None:
        health_url = f"{self.config.management_url}/health"
        click.echo(
            f"Waiting for Keycloak to be ready at... {health_url}, verify={self.config.verify}"
        )

        for attempt in range(max_retries):
            try:
                response = requests.get(f"{health_url}", verify=self.config.verify)
                if response.status_code == 200:
                    click.echo("Keycloak is ready")
                    # Add a small delay to ensure Keycloak is fully ready for admin operations
                    time.sleep(5)
                    return
            except requests.RequestException:
                if attempt < max_retries - 1:
                    time.sleep(delay)
                else:
                    raise TimeoutError("Keycloak failed to start")

    def connect(self) -> None:
        keycloak_env_path = get_env_path(
            self.config.aoc_dir,
            "keycloak",
        )
        username = get_env_value(keycloak_env_path, "KEYCLOAK_ADMIN")
        password = get_env_value(keycloak_env_path, "KEYCLOAK_ADMIN_PASSWORD")

        if not username or not password:
            raise ValueError(f"Missing Keycloak admin credentials. Username: {username}, Password: {'*' * len(password) if password else 'None'}")

        click.echo(f"Connecting to Keycloak at {self.config.server_url} with username: {username}")

        self.keycloak_admin = KeycloakAdmin(
            server_url=self.config.server_url,
            username=username,
            password=password,
            realm_name=self.config.realm_name,
            verify=self.config.verify,
        )

    def create_clients(self) -> dict:
        # Client configurations
        clients = {
            "aoc-frontend": {
                "clientId": "aoc-frontend",
                "publicClient": False,
                "redirectUris": ["*"],
                "webOrigins": ["*"],
                "serviceAccountsEnabled": True,
                "authorizationServicesEnabled": False,
                "standardFlowEnabled": True,
                "directAccessGrantsEnabled": True,
                "implicitFlowEnabled": False,
            },
            "bitswan-backend": {
                "clientId": "bitswan-backend",
                "webOrigins": ["*"],
                "publicClient": False,
                "serviceAccountsEnabled": True,
                "authorizationServicesEnabled": True,
                "directAccessGrantsEnabled": True,
                "implicitFlowEnabled": True,
                "standardFlowEnabled": True,
                "attributes": {
                    "access.token.lifespan": "2073600000",  # 24 000 days
                    "client.session.idle.timeout": "2073600000",  # 24 000 days
                    "client.session.max.lifespan": "2073600000",  # 24 000 days
                    "tokenExchange.grant.enabled": "true",
                    "oauth2.device.authorization.grant.enabled": "true",
                },
            },
        }

        # Role mappings for each client
        roles_mapping = {
            "aoc-frontend": [
                "admin",
                "view-users",
                "view-clients",
                "query-groups",
                "query-users",
                "query-clients",
                "manage-clients",
                "view-groups",
            ],
            "bitswan-backend": [
                "view-users",
                "query-groups",
                "manage-users",
                "query-users",
                "view-groups",
            ],
        }

        existing_clients = self.keycloak_admin.get_clients()
        client_ids = [client.get("id") for client in existing_clients]

        client_available_roles = {}
        for client_id in client_ids:
            roles = self.keycloak_admin.get_client_roles(client_id)
            client_available_roles[client_id] = {role["name"]: role for role in roles}
            # Add group_membership scope to client
            self.add_client_scope_to_client(client_id, "group_membership")

        client_secrets = {}

        for name, client_config in clients.items():
            try:
                client_id = self.keycloak_admin.create_client(client_config)
                # Add group_membership scope to client
                self.add_client_scope_to_client(client_id, "group_membership")
                print(f"Client ID: {client_id}")
            except KeycloakPostError as e:
                if e.response_code == 409:
                    print(f"Client {name} already exists")
                    continue
                else:
                    raise e

            service_account_user = self.keycloak_admin.get_client_service_account_user(
                client_id
            )
            service_account_user_id = service_account_user.get("id")

            # Group roles by client ID to minimize API calls
            roles_by_client = {}
            desired_roles = roles_mapping.get(name, [])

            for existing_client_id, available_roles in client_available_roles.items():
                matching_roles = []
                for role_name in desired_roles:
                    if role_name in available_roles:
                        role = available_roles[role_name]
                        matching_roles.append(role)

                if matching_roles:
                    roles_by_client[existing_client_id] = matching_roles

            # Assign roles grouped by client
            for container_client_id, roles in roles_by_client.items():
                self.keycloak_admin.assign_client_role(
                    service_account_user_id, container_client_id, roles
                )

            client_secrets[name] = self.keycloak_admin.get_client_secrets(
                client_id
            ).get("value", "")

        return client_secrets

    def initialize_admin_user(self) -> None:
        try:
            user_id = self.keycloak_admin.create_user(
                {
                    "username": self.config.admin_username,
                    "email": self.config.admin_username,
                    "enabled": True,
                    "credentials": [
                        {
                            "type": "password",
                            "value": self.config.admin_password,
                            "temporary": False,
                        }
                    ],
                }
            )
        except KeycloakPostError as e:
            if e.response_code == 409:
                click.echo("Admin user already exists")
                return
            else:
                raise e

        org_group_id = self.keycloak_admin.create_group(
            {"name": self.config.org_name, "attributes": {"type": ["org"]}}
        )

        admin_group_id = self.keycloak_admin.create_group(
            {"name": "admin", "attributes": {"tags": ["view-users"]}},
            parent=org_group_id,
            skip_exists=True,
        )

        self.keycloak_admin.group_user_add(user_id, admin_group_id)
        self.keycloak_admin.group_user_add(user_id, org_group_id)

    def update_envs_with_keycloak_secret(self, secret: dict) -> None:
        aoc_env_file = (
            OPERATIONS_CENTRE_DOCKER_ENV_FILE
        )

        bitswan_backend_env_file = (
            BITSWAN_BACKEND_DOCKER_ENV_FILE
        )

        env_updates = [
            (
                "KEYCLOAK_CLIENT_SECRET",
                "aoc-frontend",
                aoc_env_file,
            ),
            (
                "KEYCLOAK_CLIENT_SECRET_KEY",
                "bitswan-backend",
                bitswan_backend_env_file,
            ),
        ]

        click.echo(f"Updating {env_updates}")

        for (
            env_var_label,
            client_name,
            env_file,
        ) in env_updates:
            file_path = self.config.aoc_dir / "envs" / env_file
            click.echo(f"Updating {file_path}")
            with open(file_path, "a") as f:
                f.write(f"\n{env_var_label}={secret.get(client_name)}\n")

    def create_client_scope(self, scope_name: str) -> None:
        client_scope = self.keycloak_admin.get_client_scope_by_name(scope_name)
        if client_scope:
            return client_scope.get("id")

        client_scope_id = self.keycloak_admin.create_client_scope(
            {
                "name": scope_name,
                "description": "",
                "type": "none",
                "protocol": "openid-connect",
                "attributes": {
                    "display.on.consent.screen": "true",
                    "consent.screen.text": "",
                    "include.in.token.scope": "false",
                    "gui.order": "",
                },
            }
        )

        return client_scope_id

    def create_client_scope_mapper(self, scope_id: str, name: str) -> dict:
        client_scope = self.keycloak_admin.get_client_scope(scope_id)

        protocol_mapper = client_scope.get("protocolMappers", [])

        for mapper in protocol_mapper:
            if mapper.get("name") == name:
                click.echo(f"Mapper {name} already exists")
                return mapper

        click.echo(f"Adding {name} mapper to {scope_id}")
        return self.keycloak_admin.add_mapper_to_client_scope(
            scope_id,
            {
                "protocol": "openid-connect",
                "protocolMapper": "oidc-group-membership-mapper",
                "name": name,
                "config": {
                    "claim.name": name,
                    "full.path": "true",
                    "id.token.claim": "true",
                    "access.token.claim": "true",
                    "lightweight.claim": "true",
                    "userinfo.token.claim": "true",
                    "introspection.token.claim": "true",
                },
            },
        )

    def add_client_scope_to_client(self, client_id: str, scope_name: str) -> None:
        scope_id = self.create_client_scope(scope_name)
        self.create_client_scope_mapper(scope_id, scope_name)

        self.keycloak_admin.add_client_default_client_scope(
            client_id,
            scope_id,
            {},
        )

    def update_realm_smtp_server(self) -> None:
        realm_name = "master"
        realm_settings = self.keycloak_admin.get_realm(realm_name=realm_name)

        options = {
            "password": self.config.keycloak_smtp_password,
            "replyToDisplayName": "",
            "starttls": "true",
            "auth": "true",
            "port": self.config.keycloak_smtp_port,
            "host": self.config.keycloak_smtp_host,
            "replyTo": "",
            "from": self.config.keycloak_smtp_from,
            "fromDisplayName": "",
            "envelopeFrom": "",
            "ssl": "false",
            "user": self.config.keycloak_smtp_username,
        }
        realm_settings["smtpServer"] = options

        self.keycloak_admin.update_realm(realm_name=realm_name, payload=realm_settings)
