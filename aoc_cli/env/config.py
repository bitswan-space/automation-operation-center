from dataclasses import dataclass
from enum import Enum
from pathlib import Path
import yaml

INFLUXDB_ENV_FILE = "influxdb.env"

KEYCLOAK_ENV_FILE = "keycloak.env"
KEYCLOAK_DB_ENV_FILE = "keycloak-postgres.env"

BITSWAN_DB_ENV_FILE = "bitswan-backend-postgres.env"
BITSWAN_BACKEND_DOCKER_ENV_FILE = "bitswan-backend.env"

OPERATIONS_CENTRE_DOCKER_ENV_FILE = "operations-centre.env"

EMQX_ENV_FILE = "emqx.env"


class Environment(Enum):
    DEV = "dev"
    PROD = "prod"


class Protocol(Enum):
    HTTP = "http"
    HTTPS = "https"


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
    protocol: Protocol = Protocol.HTTPS
    admin_email: str = "admin@bitswan.localhost"
    org_name: str = "Example Org"
    aoc_be_image: str | None = None
    aoc_image: str | None = None
    profile_manager_image: str | None = None
    keycloak_image: str | None = None
    mkcerts: bool = False
    certs_dir: str | None = None
    from_url: str | None = None

    def get_url(self, subdomain: str) -> str:
        return f"{self.protocol.value}://{subdomain}.{self.domain}"

    def save_to_yaml(self, file_path: Path | None = None) -> None:
        """Save the InitConfig to a YAML file."""
        if file_path is None:
            file_path = self.aoc_dir / "init-config.yml"
        
        # Ensure the directory exists
        file_path.parent.mkdir(parents=True, exist_ok=True)
        
        # Convert to dict for serialization
        config_dict = {
            "env": self.env.value,
            "protocol": self.protocol.value,
            "domain": self.domain,
            "admin_email": self.admin_email,
            "org_name": self.org_name,
            "keycloak_smtp_username": self.keycloak_smtp_username,
            "keycloak_smtp_password": self.keycloak_smtp_password,
            "keycloak_smtp_host": self.keycloak_smtp_host,
            "keycloak_smtp_from": self.keycloak_smtp_from,
            "keycloak_smtp_port": self.keycloak_smtp_port,
            "aoc_be_image": self.aoc_be_image,
            "aoc_image": self.aoc_image,
            "profile_manager_image": self.profile_manager_image,
            "keycloak_image": self.keycloak_image,
            "mkcerts": self.mkcerts,
            "certs_dir": self.certs_dir,
            "from_url": self.from_url,
        }
        
        with open(file_path, "w") as f:
            yaml.dump(config_dict, f, default_flow_style=False)

    @classmethod
    def load_from_yaml(cls, file_path: Path | None = None) -> "InitConfig":
        """Load InitConfig from a YAML file."""
        if file_path is None:
            # Use the default aoc_dir value
            default_aoc_dir = Path.home() / ".config" / "bitswan" / "aoc"
            file_path = default_aoc_dir / "init-config.yml"
        
        if not file_path.exists():
            raise FileNotFoundError(f"Config file not found: {file_path}")
        
        with open(file_path, "r") as f:
            config_dict = yaml.safe_load(f)
        
        return cls(
            env=Environment(config_dict["env"]),
            protocol=Protocol(config_dict["protocol"]),
            domain=config_dict["domain"],
            admin_email=config_dict["admin_email"],
            org_name=config_dict["org_name"],
            keycloak_smtp_username=config_dict.get("keycloak_smtp_username"),
            keycloak_smtp_password=config_dict.get("keycloak_smtp_password"),
            keycloak_smtp_host=config_dict.get("keycloak_smtp_host"),
            keycloak_smtp_from=config_dict.get("keycloak_smtp_from"),
            keycloak_smtp_port=config_dict.get("keycloak_smtp_port"),
            aoc_be_image=config_dict.get("aoc_be_image"),
            aoc_image=config_dict.get("aoc_image"),
            profile_manager_image=config_dict.get("profile_manager_image"),
            keycloak_image=config_dict.get("keycloak_image"),
            mkcerts=config_dict.get("mkcerts", False),
            certs_dir=config_dict.get("certs_dir"),
            from_url=config_dict.get("from_url"),
        )
