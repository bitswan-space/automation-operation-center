from dataclasses import dataclass
from enum import Enum
from pathlib import Path

INFLUXDB_ENV_FILE = "influxdb.env"

KEYCLOAK_ENV_FILE = "keycloak.env"
KEYCLOAK_DB_ENV_FILE = "keycloak-postgres.env"

BITSWAN_DB_ENV_FILE = "bitswan-backend-postgres.env"
BITSWAN_BACKEND_DOCKER_ENV_FILE = "bitswan-backend.env"
BITSWAN_BACKEND_LOCAL_ENV_FILE = ".env"

OPERATIONS_CENTRE_DOCKER_ENV_FILE = "operations-centre.env"
OPERATIONS_CENTRE_LOCAL_ENV_FILE = ".env"

EMQX_ENV_FILE = "emqx.env"


class Environment(Enum):
    DEV = "dev"
    PROD = "prod"


class Protocol(Enum):
    HTTP = "http"
    HTTPS = "https"


class DevSetupKind(Enum):
    DOCKER = "docker"
    LOCAL = "local"


@dataclass(kw_only=True)
class InitConfig:
    env: Environment  # Required — must come first

    keycloak_smtp_username: str | None = None
    keycloak_smtp_password: str | None = None
    keycloak_smtp_host: str | None = None
    keycloak_smtp_from: str | None = None
    keycloak_smtp_port: str | None = None
    aoc_dir: Path = Path.home() / ".config" / "bitswan" / "aoc"
    domain: str = "bitswan.localhost"
    protocol: Protocol = Protocol.HTTP
    admin_email: str = "admin@bitswan.localhost"
    admin_password: str = "admin"
    org_name: str = "Example Org"
    dev_setup: DevSetupKind = DevSetupKind.DOCKER
    aoc_be_image: str | None = None
    aoc_image: str | None = None
    profile_manager_image: str | None = None

    def get_url(self, subdomain: str) -> str:
        return f"{self.protocol.value}://{subdomain}.{self.domain}"
