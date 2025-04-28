import json
import shutil
import subprocess
from pathlib import Path
from typing import Dict

import click

from aoc_cli.env.config import Environment, InitConfig
from aoc_cli.env.services import bootstrap_services
from aoc_cli.env.variables import get_var_defaults
from aoc_cli.services.caddy import CaddyService
from aoc_cli.services.influxdb import InfluxDBService
from aoc_cli.services.keycloak import KeycloakConfig, KeycloakService
from aoc_cli.utils.secrets import generate_secret
from aoc_cli.utils.tools import get_aoc_working_directory


class InitCommand:
    def __init__(self, config: InitConfig):
        self.config = config

    async def execute(self) -> None:
        await self.setup_environment()

    async def setup_environment(self) -> None:
        if self.config.env == Environment.DEV:
            self.create_aoc_directory()
            self.copy_compose_file()

        self.setup_secrets()

        keycloak_confirm = click.confirm(
            "\n\nDo you want to setup Keycloak?", default=True, abort=True
        )
        if keycloak_confirm:
            self.setup_keycloak()

        influxdb_confirm = click.confirm(
            "\n\nDo you want to setup InfluxDB?", default=True, abort=True
        )
        if influxdb_confirm:
            self.setup_influxdb()

        self.cleanup()

        aoc_working_dir = get_aoc_working_directory(
            self.config.env, self.config.aoc_dir
        )
        click.echo("AoC initialized successfully!")

        if self.config.env == Environment.PROD:
            click.echo(
                f"You can launch the aoc by going to {aoc_working_dir} and running `docker-compose up -d`"
            )

        access_message = f"""
        Access the AOC at the url {self.config.protocol.value}://aoc.{self.config.domain}"""

        if self.config.env == Environment.DEV:
            access_message = f"""
        run:

        docker compose -f ./deployment/docker-compose.{self.config.env.value}.yml up -d

        cd to the nextjs directory and run:
        pnpm dev

        and

        Access the AOC at the url http://localhost:3000
        """

        click.echo(access_message)

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
        keycloak_config = KeycloakConfig(
            admin_username=self.config.admin_email,
            admin_password=self.config.admin_password,
            aoc_dir=self.config.aoc_dir,
            org_name=self.config.org_name,
            env=self.config.env,
            dev_setup=self.config.dev_setup,
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
        cwd = get_aoc_working_directory(self.config.env, self.config.aoc_dir)
        subprocess.run(
            [
                "docker",
                "compose",
                "-f",
                f"docker-compose.{self.config.env.value}.yml",
                "down",
            ],
            cwd=cwd,
            check=True,
        )

    def generate_secrets(self, vars: Dict[str, str]) -> Dict[str, str]:
        """Generate all required secrets"""
        secrets_map = {
            "KC_DB_PASSWORD": None,
            "BITSWAN_BACKEND_POSTGRES_PASSWORD": None,
            "INFLUXDB_PASSWORD": "DOCKER_INFLUXDB_INIT_PASSWORD",
            "AUTH_SECRET": None,
            "KEYCLOAK_ADMIN_PASSWORD": None,
            "CCS_CONFIG_KEY": None,
            "EMQX_DASHBOARD__DEFAULT_PASSWORD": None,
            "DJANGO_SECRET_KEY": None,
            "AUTH_SECRET_KEY": None,
            "EMQX_AUTHENTICATION__1__SECRET": None,
        }

        for key, linked_key in secrets_map.items():
            vars[key] = generate_secret()
            if linked_key:
                vars[linked_key] = vars[key]

        return vars

    def setup_secrets(self) -> None:
        """Setup command implementation"""
        vars = get_var_defaults(
            self.config,
        )

        aoc_working_dir = get_aoc_working_directory(
            self.config.env, self.config.aoc_dir
        )

        secrets_file = aoc_working_dir / "secrets.json"
        if secrets_file.exists():
            with open(secrets_file, "r") as f:
                secrets = json.load(f)
                vars.update(secrets)
        else:
            vars = self.generate_secrets(vars)

        bootstrap_services(self.config, vars)
