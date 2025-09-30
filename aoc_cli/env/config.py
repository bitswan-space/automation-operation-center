from dataclasses import dataclass
from enum import Enum
from pathlib import Path
import os
import typing as t
import yaml
import click
from dotenv import load_dotenv

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

    @classmethod
    def collect_configurations(
        cls,
        interactive: bool,
        env: str,
        domain: str,
        protocol: str,
        admin_email: str,
        org_name: str,
        keycloak_smtp_username: str,
        keycloak_smtp_password: str,
        keycloak_smtp_host: str,
        keycloak_smtp_from: str,
        keycloak_smtp_port: str,
        aoc_dir: Path,
        mkcerts: bool = False,
        certs_dir: str = None,
        from_url: str = None,
        aoc_be_image: str = None,
        aoc_image: str = None,
        keycloak_image: str = None,
    ) -> "InitConfig":
        """
        Collect configuration values using CLI options, env variables, or interactive input.
        Returns an InitConfig object with resolved values.
        """
        
        # Environment variable constants
        AOC_SETUP_ENVIRONMENT = "AOC_SETUP_ENVIRONMENT"
        AOC_DOMAIN = "AOC_DOMAIN"
        AOC_PROTOCOL = "AOC_PROTOCOL"
        AOC_ADMIN_EMAIL = "AOC_ADMIN_EMAIL"
        AOC_ORG_NAME = "AOC_ORG_NAME"
        KEYCLOAK_SMTP_USERNAME = "KEYCLOAK_SMTP_USERNAME"
        KEYCLOAK_SMTP_PASSWORD = "KEYCLOAK_SMTP_PASSWORD"
        KEYCLOAK_SMTP_HOST = "KEYCLOAK_SMTP_HOST"
        KEYCLOAK_SMTP_FROM = "KEYCLOAK_SMTP_FROM"
        KEYCLOAK_SMTP_PORT = "KEYCLOAK_SMTP_PORT"

        config_map = {
            "env": {
                "option": env,
                "env_var": AOC_SETUP_ENVIRONMENT,
                "prompt_text": "Environment",
                "hide_input": False,
                "default": "prod",
                "type": click.Choice(["dev", "prod"]),
            },
            "domain": {
                "option": domain,
                "env_var": AOC_DOMAIN,
                "prompt_text": "Domain",
                "hide_input": False,
                "default": "localhost",
            },
            "protocol": {
                "option": protocol,
                "env_var": AOC_PROTOCOL,
                "prompt_text": "Protocol",
                "hide_input": False,
                "default": "https",
                "type": click.Choice(["http", "https"]),
            },
            "admin_email": {
                "option": admin_email,
                "env_var": AOC_ADMIN_EMAIL,
                "prompt_text": "Admin email",
                "hide_input": False,
                "default": "admin@example.com",
            },
            "org_name": {
                "option": org_name,
                "env_var": AOC_ORG_NAME,
                "prompt_text": "Organization name",
                "hide_input": False,
                "default": "Example Organization",
            },
            "keycloak_smtp_username": {
                "option": keycloak_smtp_username,
                "env_var": KEYCLOAK_SMTP_USERNAME,
                "prompt_text": "Keycloak SMTP username",
                "hide_input": False,
                "default": "auth.no-reply@bitswan.localhost",
            },
            "keycloak_smtp_password": {
                "option": keycloak_smtp_password,
                "env_var": KEYCLOAK_SMTP_PASSWORD,
                "prompt_text": "Keycloak SMTP password",
                "hide_input": True,
            },
            "keycloak_smtp_host": {
                "option": keycloak_smtp_host,
                "env_var": KEYCLOAK_SMTP_HOST,
                "prompt_text": "Keycloak SMTP host",
                "hide_input": False,
            },
            "keycloak_smtp_from": {
                "option": keycloak_smtp_from,
                "env_var": KEYCLOAK_SMTP_FROM,
                "prompt_text": "Keycloak SMTP from",
                "hide_input": False,
            },
            "keycloak_smtp_port": {
                "option": keycloak_smtp_port,
                "env_var": KEYCLOAK_SMTP_PORT,
                "prompt_text": "Keycloak SMTP port",
                "hide_input": False,
            },
        }

        # Helper function to get config value
        def get_config_value(
            option: str,
            env_var: str,
            prompt_text: str,
            default: t.Optional[any] = None,
            type: t.Optional[t.Union[click.ParamType, t.Any]] = None,
            hide_input: bool = False,
            interactive: bool = True,
        ):
            """Get a configuration value by checking CLI option, env var, or prompting user."""
            if option:
                return option
            elif env_var in os.environ:
                return os.environ[env_var]
            elif interactive:
                return click.prompt(
                    prompt_text, default=default, hide_input=hide_input, type=type
                )
            else:
                return default

        # Collect all configuration values
        configs = {}
        for key, config_info in config_map.items():
            configs[key] = get_config_value(
                option=config_info.get("option"),
                env_var=config_info.get("env_var"),
                prompt_text=config_info.get("prompt_text"),
                hide_input=config_info.get("hide_input", False),
                default=config_info.get("default"),
                type=config_info.get("type"),
                interactive=interactive,
            )

        # Create and return InitConfig object
        return cls(
            env=Environment(configs.get("env")),
            aoc_dir=aoc_dir,
            protocol=Protocol(configs.get("protocol")),
            domain=configs.get("domain"),
            admin_email=configs.get("admin_email"),
            org_name=configs.get("org_name"),
            aoc_be_image=aoc_be_image,
            aoc_image=aoc_image,
            keycloak_image=keycloak_image,
            keycloak_smtp_username=configs.get("keycloak_smtp_username"),
            keycloak_smtp_password=configs.get("keycloak_smtp_password"),
            keycloak_smtp_host=configs.get("keycloak_smtp_host"),
            keycloak_smtp_from=configs.get("keycloak_smtp_from"),
            keycloak_smtp_port=configs.get("keycloak_smtp_port"),
            mkcerts=mkcerts,
            certs_dir=certs_dir,
            from_url=from_url,
        )

    @classmethod
    def create_dev_config(
        cls,
        aoc_dir: Path,
        admin_email: str = None,
        org_name: str = None,
        aoc_be_image: str = None,
        aoc_image: str = None,
        keycloak_image: str = None,
        mkcerts: bool = True,
        certs_dir: str = None,
        from_url: str = None,
    ) -> "InitConfig":
        """Create a development configuration with sensible defaults."""
        return cls(
            env=Environment.DEV,
            aoc_dir=aoc_dir,
            protocol=Protocol.HTTPS,
            domain="bitswan.localhost",
            admin_email=admin_email or "admin@example.com",
            org_name=org_name or "Example Org",
            aoc_be_image=aoc_be_image,
            aoc_image=aoc_image,
            keycloak_image=keycloak_image,
            keycloak_smtp_username="",
            keycloak_smtp_password="",
            keycloak_smtp_host="mailpit",
            keycloak_smtp_from="auth@bitswan.localhost",
            keycloak_smtp_port="1025",
            mkcerts=mkcerts,
            certs_dir=certs_dir,
            from_url=from_url,
        )
