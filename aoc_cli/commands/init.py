import json
import shutil
import subprocess
from pathlib import Path
from typing import Dict

import click

from aoc_cli.config import InitConfig
from aoc_cli.config.services import Services
from aoc_cli.config.variables import get_var_defaults
from aoc_cli.services.caddy import CaddyService
from aoc_cli.services.influxdb import InfluxDBService
from aoc_cli.services.keycloak import KeycloakConfig, KeycloakService
from aoc_cli.utils.env import write_env_file
from aoc_cli.utils.secrets import generate_secret


class InitCommand:
    def __init__(self, config: InitConfig):
        self.config = config

    async def execute(self) -> None:
        if self.config.env.value == "prod" or self.config.env.value == "staging":
            await self.setup_production_or_staging_environment()
        else:
            await self.setup_development_environment()

    async def setup_production_or_staging_environment(self) -> None:
        click.echo(f"Setting up {self.config.env.value} environment...")

        self.create_aoc_directory()
        self.copy_compose_file()
        self.setup_secrets()
        await self.setup_caddy()
        self.setup_keycloak()
        self.setup_influxdb()

        self.cleanup()

        click.echo("AoC initialized successfully!")
        click.echo(
            f"You can launch the aoc by going to {self.config.aoc_dir} and running `docker-compose up -d`"
        )
        click.echo(
            f"Access the AOC at the url {self.config.protocol.value}://aoc.{self.config.domain}"
        )

    async def setup_development_environment(self) -> None:
        click.echo("Setting up development environment...")

    def create_aoc_directory(self) -> None:
        self.config.aoc_dir.mkdir(parents=True, exist_ok=True)

    def copy_compose_file(self) -> None:
        template_path = (
            Path(__file__).parent.parent
            / "templates"
            / self.config.env.value
            / "docker-compose.yml"
        )
        if not template_path.exists():
            raise FileNotFoundError(f"Template not found: {template_path}")

        dest_path = self.config.aoc_dir / "docker-compose.yml"
        shutil.copy2(template_path, dest_path)

    def setup_keycloak(self) -> None:
        print("Initializing Keycloak Client")

        keycloak_config = KeycloakConfig(
            admin_username=self.config.admin_email,
            admin_password=self.config.admin_password,
            aoc_dir=self.config.aoc_dir,
            org_name=self.config.org_name,
        )

        keycloak = KeycloakService(keycloak_config)
        keycloak.setup()

    def setup_influxdb(self) -> None:
        print("Initializing InfluxDB")

        influxdb = InfluxDBService(self.config)
        influxdb.setup()

    async def setup_caddy(self) -> None:
        print("Initializing Caddy")

        caddy = CaddyService(self.config)
        await caddy.initialize()
        await caddy.add_proxy(
            f"{self.config.protocol.value}://keycloak.{self.config.domain}",
            "aoc-keycloak:8080",
        )
        await caddy.add_proxy(
            f"{self.config.protocol.value}://aoc.{self.config.domain}",
            "automation-operation-centre:3000",
        )
        caddy.start()

    def cleanup(self) -> None:
        subprocess.run(
            ["docker", "compose", "down"],
            cwd=self.config.aoc_dir,
            check=True,
        )

    def generate_secrets(self, vars: Dict[str, str]) -> Dict[str, str]:
        """Generate all required secrets"""
        secrets_map = {
            "KEYCLOAK_POSTGRES_PASSWORD": "KC_DB_PASSWORD",
            "BITSWAN_POSTGRES_PASSWORD": None,
            "INFLUXDB_PASSWORD": "DOCKER_INFLUXDB_INIT_PASSWORD",
            "AUTH_SECRET": None,
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

    def setup_secrets(self) -> int:
        """Setup command implementation"""
        vars = get_var_defaults(
            self.config,
        )
        # If config.aoc_dir / "secrets.json" exists then load the secrets from there
        # otherwise generate new secrets and save them to the file.
        secrets_file = self.config.aoc_dir / "secrets.json"
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

            write_env_file(vars, service, self.config.aoc_dir)

        return 0
