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
        self.add_initial_users_to_global_superadmin()
        self.update_realm_smtp_server()

        self.update_envs_with_keycloak_secret(client_secrets)
        self.create_django_social_app()
        click.echo("✓ Keycloak setup complete")

    def configure_realm_settings(self) -> None:
        realm = self.keycloak_admin.get_realm(self.config.realm_name)

        realm["ssoSessionMaxLifespan"] = 2073600000
        realm["loginTheme"] = "bitswan-keycloak-theme"

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

        try:
            policy = self.keycloak_admin.create_client_authz_client_policy(
                policy, master_realm_client_id
            )
        except KeycloakPostError as e:
            if e.response_code == 409:
                click.echo("Policy 'default-token-exchange-policy' already exists, skipping creation")
                # Find existing policy
                policies = self.keycloak_admin.get_client_authz_policies(master_realm_client_id)
                policy = next(
                    (p for p in policies if p["name"] == "default-token-exchange-policy"),
                    None
                )
                if not policy:
                    raise ValueError("Could not find existing policy 'default-token-exchange-policy'")
            else:
                raise e

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

        try:
            self.keycloak_admin.create_client_authz_scope_permission(
                permission, bitswan_backend_client_id
            )
        except KeycloakPostError as e:
            if e.response_code == 409:
                click.echo("Permission 'bitswan-backend-token-exchange' already exists, skipping creation")
            else:
                raise e

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
                "redirectUris": ["*"],
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
                    print(f"Client {name} already exists, recreating with new configuration...")
                    # Find existing client and delete it
                    existing_clients = self.keycloak_admin.get_clients()
                    client_id = None
                    for client in existing_clients:
                        if client.get("clientId") == name:
                            client_id = client.get("id")
                            break
                    
                    if client_id:
                        # Delete the existing client
                        self.keycloak_admin.delete_client(client_id)
                        print(f"Deleted existing client {name}")
                        
                        # Create the client with new configuration
                        client_id = self.keycloak_admin.create_client(client_config)
                        print(f"Recreated client {name} with ID: {client_id}")
                    else:
                        print(f"Could not find existing client {name}")
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
                    "emailVerified": True,
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
                # Get existing user ID
                users = self.keycloak_admin.get_users(query={"email": self.config.admin_username})
                if users:
                    user_id = users[0]["id"]
                else:
                    click.echo("Could not find existing admin user")
                    return
            else:
                raise e

        # Create GlobalSuperAdmin group
        global_superadmin_group_id = self.create_global_superadmin_group()
        
        # Add admin user to GlobalSuperAdmin group
        self.keycloak_admin.group_user_add(user_id, global_superadmin_group_id)

        try:
            org_group_id = self.keycloak_admin.create_group(
                {"name": self.config.org_name, "attributes": {"type": ["org"]}}
            )
        except KeycloakPostError as e:
            if e.response_code == 409:
                click.echo(f"Organization group '{self.config.org_name}' already exists, finding existing group")
                # Find existing group
                groups = self.keycloak_admin.get_groups()
                org_group = next(
                    (g for g in groups if g["name"] == self.config.org_name),
                    None
                )
                if not org_group:
                    raise ValueError(f"Could not find existing organization group '{self.config.org_name}'")
                org_group_id = org_group["id"]
            else:
                raise e

        admin_group_id = self.keycloak_admin.create_group(
            {"name": "admin", "attributes": {"tags": ["view-users"]}},
            parent=org_group_id,
            skip_exists=True,
        )

        # If skip_exists=True and group already exists, admin_group_id will be None
        # In that case, we need to find the existing group and get its ID
        if admin_group_id is None:
            click.echo("Admin group already exists, finding existing group")
            # Get all groups under the org to find the existing admin group
            try:
                org_group = self.keycloak_admin.get_group(org_group_id)
                sub_groups = org_group.get("subGroups", [])
                admin_group = next(
                    (g for g in sub_groups if g["name"] == "admin"),
                    None
                )
                if not admin_group:
                    raise ValueError("Could not find existing admin group")
                admin_group_id = admin_group["id"]
            except Exception as e:
                click.echo(f"Error finding existing admin group: {e}")
                raise

        self.keycloak_admin.group_user_add(user_id, admin_group_id)
        self.keycloak_admin.group_user_add(user_id, org_group_id)

    def create_global_superadmin_group(self) -> str:
        """Create GlobalSuperAdmin group for Django admin access."""
        try:
            # First, try to get existing group ID from secrets
            existing_group_id = self.get_existing_group_id_from_secrets()
            if existing_group_id:
                # Verify the group still exists in Keycloak
                try:
                    group = self.keycloak_admin.get_group(existing_group_id)
                    if group and group.get("name") == "GlobalSuperAdmin":
                        click.echo("✓ GlobalSuperAdmin group found in secrets and verified in Keycloak")
                        return existing_group_id
                except Exception:
                    # Group doesn't exist in Keycloak anymore, continue to create new one
                    click.echo("⚠️ Group ID in secrets no longer exists in Keycloak, creating new group")
            
            # Create new group or find existing one
            group_id = self.keycloak_admin.create_group(
                {
                    "name": "GlobalSuperAdmin",
                    "attributes": {
                        "type": ["global-admin"],
                        "description": ["Global super admin group for Django admin access"],
                        "django_admin_access": ["true"]
                    }
                },
                skip_exists=True,
            )
            
            if group_id is None:
                # Group already exists, find it
                groups = self.keycloak_admin.get_groups()
                for group in groups:
                    if group["name"] == "GlobalSuperAdmin":
                        group_id = group["id"]
                        break
                        
            click.echo("✓ GlobalSuperAdmin group created/found")
            return group_id
            
        except Exception as e:
            click.echo(f"Error creating GlobalSuperAdmin group: {e}")
            raise

    def get_existing_group_id_from_secrets(self) -> str:
        """Get existing GlobalSuperAdmin group ID from secrets.json."""
        try:
            from aoc_cli.commands.init import get_secret_from_file
            from aoc_cli.env.config import InitConfig, Environment
            
            # Create a minimal config object for the helper function
            config = InitConfig(env=self.config.env, aoc_dir=self.config.aoc_dir)
            return get_secret_from_file(config, "KEYCLOAK_GLOBAL_SUPERADMIN_GROUP_ID")
            
        except Exception as e:
            click.echo(f"Error reading group ID from secrets: {e}")
            return ""

    def add_initial_users_to_global_superadmin(self) -> None:
        """Add initial users to GlobalSuperAdmin group for Django admin access."""
        try:
            # Get GlobalSuperAdmin group
            groups = self.keycloak_admin.get_groups()
            global_superadmin_group = None
            for group in groups:
                if group["name"] == "GlobalSuperAdmin":
                    global_superadmin_group = group
                    break
            
            if not global_superadmin_group:
                click.echo("GlobalSuperAdmin group not found")
                return
                
            # For now, we'll add the admin user that was just created
            # In the future, this could be extended to add additional users
            # based on configuration or environment variables
            
            click.echo("✓ Initial users added to GlobalSuperAdmin group")
            
        except Exception as e:
            click.echo(f"Error adding users to GlobalSuperAdmin group: {e}")
            # Don't raise here as this is not critical for basic functionality

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

        # Add GlobalSuperAdmin group ID to secrets and env file
        self.add_global_superadmin_group_id_to_secrets_and_env(bitswan_backend_env_file)

    def add_global_superadmin_group_id_to_secrets_and_env(self, env_file: str) -> None:
        """Add GlobalSuperAdmin group ID to secrets.json and environment file."""
        try:
            # Get GlobalSuperAdmin group ID
            groups = self.keycloak_admin.get_groups()
            global_superadmin_group_id = None
            
            for group in groups:
                if group["name"] == "GlobalSuperAdmin":
                    global_superadmin_group_id = group["id"]
                    break
            
            if global_superadmin_group_id:
                # Add to secrets.json (only if not already present)
                self.add_group_id_to_secrets_if_missing(global_superadmin_group_id)
                
                # Add to environment file
                file_path = self.config.aoc_dir / "envs" / env_file
                click.echo(f"Adding GlobalSuperAdmin group ID to {file_path}")
                with open(file_path, "a") as f:
                    f.write(f"\nKEYCLOAK_GLOBAL_SUPERADMIN_GROUP_ID={global_superadmin_group_id}\n")
                click.echo(f"✓ GlobalSuperAdmin group ID saved: {global_superadmin_group_id}")
            else:
                click.echo("⚠️ GlobalSuperAdmin group not found, skipping group ID export")
                
        except Exception as e:
            click.echo(f"Error adding GlobalSuperAdmin group ID: {e}")
            # Don't raise here as this is not critical for basic functionality

    def add_group_id_to_secrets_if_missing(self, group_id: str) -> None:
        """Add GlobalSuperAdmin group ID to secrets.json only if not already present."""
        try:
            from aoc_cli.commands.init import get_secret_from_file
            from aoc_cli.env.config import InitConfig, Environment
            
            # Create a minimal config object for the helper function
            config = InitConfig(env=self.config.env, aoc_dir=self.config.aoc_dir)
            
            # Check if already exists
            existing_id = get_secret_from_file(config, "KEYCLOAK_GLOBAL_SUPERADMIN_GROUP_ID")
            if existing_id:
                click.echo(f"✓ GlobalSuperAdmin group ID already exists in secrets.json")
                return
            
            # Add to secrets
            import json
            secrets_file = self.config.aoc_dir / "secrets.json"
            secrets = {}
            
            if secrets_file.exists():
                with open(secrets_file, "r") as f:
                    secrets = json.load(f)
            
            secrets["KEYCLOAK_GLOBAL_SUPERADMIN_GROUP_ID"] = group_id
            
            with open(secrets_file, "w") as f:
                json.dump(secrets, f, indent=2)
                
            click.echo(f"✓ GlobalSuperAdmin group ID added to secrets.json")
            
        except Exception as e:
            click.echo(f"Error adding group ID to secrets: {e}")
            # Don't raise here as this is not critical for basic functionality

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

    def create_django_social_app(self) -> None:
        """Create the Django social app for Keycloak OAuth integration."""
        try:
            import subprocess
            
            # Wait for the Django container to be ready
            click.echo("Waiting for Django container to be ready...")
            self._wait_for_django_container()
            
            # Get the client secret
            client_secret = get_secret_from_file(self.config, 'KEYCLOAK_CLIENT_SECRET_KEY')
            
            # Run the Django management command
            cmd = [
                "docker", "exec", "aoc-bitswan-backend",
                "python", "manage.py", "setup_keycloak_social_app",
                "--client-id", "bitswan-backend",
                "--client-secret", client_secret,
                "--server-url", self.config.server_url,
                "--realm", self.config.realm_name,
            ]
            
            result = subprocess.run(cmd, capture_output=True, text=True, cwd=self.config.aoc_dir)
            
            if result.returncode == 0:
                click.echo("✓ Django social app created/updated successfully")
                if result.stdout:
                    click.echo(result.stdout)
            else:
                click.echo(f"Warning: Failed to create Django social app: {result.stderr}")
                
        except Exception as e:
            click.echo(f"Warning: Failed to create Django social app: {e}")
            # Don't raise the exception as this is not critical for the main initialization

    def _wait_for_django_container(self) -> None:
        """Wait for the Django container to be ready."""
        import time
        import subprocess
        
        max_attempts = 30
        for attempt in range(max_attempts):
            try:
                # Check if the container is running and Django is ready
                result = subprocess.run(
                    ["docker", "exec", "aoc-bitswan-backend", "python", "manage.py", "check"],
                    capture_output=True,
                    text=True,
                    timeout=10
                )
                if result.returncode == 0:
                    return
            except (subprocess.TimeoutExpired, subprocess.CalledProcessError):
                pass
            
            if attempt < max_attempts - 1:
                time.sleep(2)
        
        raise TimeoutError("Django container did not become ready in time")
