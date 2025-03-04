from dataclasses import dataclass
from enum import Enum
from pathlib import Path


class Environment(Enum):
    DEV = "dev"
    PROD = "prod"


class Protocol(Enum):
    HTTP = "http"
    HTTPS = "https"


@dataclass
class InitConfig:
    env: Environment
    aoc_dir: Path = Path.home() / ".config" / "bitswan" / "aoc"
    domain: str = "platform.local"
    protocol: Protocol = Protocol.HTTP
    admin_email: str = "admin@platform.local"
    admin_password: str = "admin"
    org_name: str = "Example Org"

    def get_url(self, subdomain: str) -> str:
        return f"{self.protocol.value}://{subdomain}.{self.domain}"


INFLUXDB_ENV_FILE = "influxdb.env"
KEYCLOAK_ENV_FILE = "keycloak.env"
KEYCLOAK_DB_ENV_FILE = "keycloak-postgres.env"
BITSWAN_DB_ENV_FILE = "bitswan-backend-postgres.env"
BITSWAN_BACKEND_ENV_FILE = "bitswan-backend.env"
OPERATIONS_CENTRE_ENV_FILE = "operations-centre.env"
EMQX_ENV_FILE = "emqx.env"
