import shutil
import subprocess
from pathlib import Path
from typing import Dict
import json

from aoc_cli.config import Environment, InitConfig, Protocol
from aoc_cli.config.services import Services
from aoc_cli.config.variables import get_var_defaults
from aoc_cli.services.caddy import CaddyService
from aoc_cli.services.influxdb import InfluxDBService
from aoc_cli.services.keycloak import KeycloakConfig, KeycloakService
from aoc_cli.utils.env import write_env_file
from aoc_cli.utils.secrets import generate_secret


class InitCommand:
    def execute(self, args) -> None:
        config = InitConfig(
            env=Environment(args.env),
            aoc_dir=args.output_dir,
            protocol=Protocol(args.protocol),
            domain=args.domain,
            admin_email=args.admin_email,
            admin_password=args.admin_password,
            org_name=args.org_name,
        )

        self.create_aoc_directory(config)
        self.copy_compose_file(config)
        self.setup_environment(config)
        self.setup_caddy(config)
        self.setup_keycloak(config)
        self.setup_influxdb(config)

        self.cleanup(config)
        print("Aoc initialized successfully!")
        print(f"You can launch the aoc by going to {config.aoc_dir} and running `docker-compose up`")
        print(f"Access the AOC at the url {config.protocol.value}://aoc.{config.domain}")

    def create_aoc_directory(self, config: InitConfig) -> None:
        config.aoc_dir.mkdir(parents=True, exist_ok=True)

    def copy_compose_file(self, config: InitConfig) -> None:
        template_path = (
            Path(__file__).parent.parent
            / "templates"
            / config.env.value
            / "docker-compose.yml"
        )
        if not template_path.exists():
            raise FileNotFoundError(f"Template not found: {template_path}")

        dest_path = config.aoc_dir / "docker-compose.yml"
        shutil.copy2(template_path, dest_path)

    def setup_keycloak(self, config: InitConfig) -> None:
        print("Initializing Keycloak Client")

        config = KeycloakConfig(
            admin_username=config.admin_email,
            admin_password=config.admin_password,
            aoc_dir=Path.home() / ".aoc",
            org_name=config.org_name,
        )

        keycloak = KeycloakService(config)
        keycloak.setup()

    def setup_influxdb(self, config: InitConfig) -> None:
        print("Initializing InfluxDB")

        influxdb = InfluxDBService(config)
        influxdb.setup()

    def setup_caddy(self, config: InitConfig) -> None:
        print("Initializing Caddy")

        caddy = CaddyService(config)
        caddy.initialize()
        caddy.add_proxy(
            f"{config.protocol.value}://keycloak.{config.domain}", "aoc-keycloak:8080"
        )
        caddy.add_proxy(
            f"{config.protocol.value}://aoc.{config.domain}",
            "automation-operation-centre:3000",
        )
        caddy.start()

    def cleanup(self, config) -> None:
        print("Cleaning up...")
        subprocess.run(
            ["docker-compose", "down"],
            cwd=config.aoc_dir,
            check=True,
        )

    def generate_secrets(self, vars: Dict[str, str]) -> Dict[str, str]:
        """Generate all required secrets"""
        secrets_map = {
            "KEYCLOAK_POSTGRES_PASSWORD": "KC_DB_PASSWORD",
            "BITSWAN_POSTGRES_PASSWORD": None,
            "INFLUXDB_PASSWORD": "DOCKER_INFLUXDB_INIT_PASSWORD",
            "NEXTAUTH_SECRET": None,
            "KEYCLOAK_ADMIN_PASSWORD": None,
            "CCS_CONFIG_KEY": None,
            "EMQX_DASHBOARD__DEFAULT_PASSWORD": None,
            "DJANGO_SECRET_KEY": None,
            "AUTH_SECRET_KEY": None,
        }

        for key, linked_key in secrets_map.items():
            vars[key] = generate_secret()
            if linked_key:
                vars[linked_key] = vars[key]

        return vars

    def setup_environment(self, config: InitConfig) -> int:
        """Setup command implementation"""
        vars = get_var_defaults(
            config,
        )
        # If config.aoc_dir / "secrets.json" exists then load the secrets from there
        # otherwise generate new secrets and save them to the file.
        secrets_file = config.aoc_dir / "secrets.json"
        if secrets_file.exists():
            with open(secrets_file, "r") as f:
                secrets = json.load(f)
                vars.update(secrets)
        else:
            vars = self.generate_secrets(vars)
            with open(secrets_file, "w") as f:
                json.dump(vars, f)

        for service in [
            Services.INFLUXDB,
            Services.KEYCLOAK,
            Services.KEYCLOAK_DB,
            Services.BITSWAN_DB,
            Services.OPERATIONS_CENTRE,
            Services.EMQX,
            Services.BITSWAN_BACKEND,
        ]:

            write_env_file(vars, service, config.aoc_dir)

        return 0


def add_subparser(subparsers):
    """Add the init command to the main parser"""
    parser = subparsers.add_parser(
        "init", help="Initialize Necessary Services and Configurations"
    )
    parser.add_argument(
        "--output-dir", default=Path.home() / ".aoc", help="Config directory"
    )
    parser.add_argument(
        "--env",
        choices=[e.value for e in Environment],
        default=Environment.DEV.value,
        help="Environment to initialize (default: %(default)s)",
    )
    parser.add_argument(
        "--domain",
        default="platform.local",
        help="Domain where the platform will be accessed (default: %(default)s)",
    )
    parser.add_argument(
        "--protocol",
        default="http",
        choices=["http", "https"],
        help="Protocol to use for platform access (default: %(default)s)",
    )
    parser.add_argument(
        "--org-name",
        default="Example Org",
        help="Name of the organization (default: %(default)s)",
    )
    parser.add_argument(
        "--admin-email",
        default="admin@platform.local",
        help="Email address for the admin user (default: %(default)s)",
    )
    parser.add_argument(
        "--admin-password",
        default="admin",
        help="Password for the admin user (default: %(default)s)",
    )
    parser.set_defaults(func=InitCommand().execute)
