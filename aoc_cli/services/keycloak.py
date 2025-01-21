import subprocess
import time
from dataclasses import dataclass
from pathlib import Path

import requests
from keycloak import KeycloakAdmin

from aoc_cli.config import (
    BITSWAN_BACKEND_ENV_FILE,
    KEYCLOAK_ENV_FILE,
    OPERATIONS_CENTRE_ENV_FILE,
)
from aoc_cli.utils.env import get_env_value


@dataclass
class KeycloakConfig:
    admin_username: str
    admin_password: str
    aoc_dir: Path
    realm_name: str = "master"
    server_url: str = "http://localhost:10000"
    verify: bool = False
    org_name: str = "Example Org"


class KeycloakService:
    def __init__(self, config: KeycloakConfig):
        self.config = config
        self.keycloak_admin = None

    def setup(self) -> None:
        self.start_services()
        self.wait_for_service()
        self.connect()

        client_secrets = self.create_clients()
        print(f"keycloak secrets: {client_secrets}")

        self.initialize_admin_user()

        self._update_envs_with_keycloak_secret(client_secrets)
        print("Keycloak setup complete")

    def start_services(self) -> None:
        subprocess.run(
            ["docker-compose", "up", "-d", "keycloak", "postgres"],
            cwd=self.config.aoc_dir,
            check=True,
        )

    def wait_for_service(self, max_retries: int = 30, delay: int = 10) -> None:
        print("Waiting for Keycloak to be ready...")
        for attempt in range(max_retries):
            try:
                response = requests.get(
                    f"{self.config.server_url}/health", verify=self.config.verify
                )
                if response.status_code == 200:
                    print("Keycloak is ready")
                    return
            except requests.RequestException:
                if attempt < max_retries - 1:
                    time.sleep(delay)
                else:
                    raise TimeoutError("Keycloak failed to start")

    def connect(self) -> None:

        username = get_env_value(
            self.config.aoc_dir / ".envs" / KEYCLOAK_ENV_FILE, "KEYCLOAK_ADMIN"
        )
        password = get_env_value(
            self.config.aoc_dir / ".envs" / KEYCLOAK_ENV_FILE, "KEYCLOAK_ADMIN_PASSWORD"
        )

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
        print(f"Existing clients: {client_ids}")

        client_available_roles = {}
        for client_id in client_ids:
            roles = self.keycloak_admin.get_client_roles(client_id)
            client_available_roles[client_id] = {role["name"]: role for role in roles}

        client_secrets = {}

        for name, client_config in clients.items():

            client_id = self.keycloak_admin.create_client(client_config)
            print(f"Client ID: {client_id}")

            service_account_user = self.keycloak_admin.get_client_service_account_user(
                client_id
            )
            service_account_user_id = service_account_user.get("id")
            print(f"Service account user ID: {service_account_user_id}")

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
                print(f"Assigning {len(roles)} roles from client {container_client_id}")
                self.keycloak_admin.assign_client_role(
                    service_account_user_id, container_client_id, roles
                )

            client_secrets[name] = self.keycloak_admin.get_client_secrets(
                client_id
            ).get("value", "")

        return client_secrets

    def initialize_admin_user(self) -> None:
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

    def _update_envs_with_keycloak_secret(self, secret: dict) -> None:
        env_updates = {
            OPERATIONS_CENTRE_ENV_FILE: ("KEYCLOAK_CLIENT_SECRET", "aoc-frontend"),
            BITSWAN_BACKEND_ENV_FILE: (
                "DJANGO_KEYCLOAK_CLIENT_SECRET",
                "bitswan-backend",
            ),
        }

        for env_file, (env_var_label, client_name) in env_updates.items():
            file_path = self.config.aoc_dir / ".envs" / env_file
            with open(file_path, "a") as f:
                f.write(f"{env_var_label}={secret.get(client_name)}\n")
