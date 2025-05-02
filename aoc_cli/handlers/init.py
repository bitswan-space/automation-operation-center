import json
import os
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
        await self.setup_caddy()

        if self.config.env == Environment.DEV:
            self.generate_certs()
            self.setup_etc_hosts()
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
        cd to {aoc_working_dir} and run:

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
            f"{self.config.protocol.value}://auth.{self.config.domain}",
            "aoc-keycloak:8080"
        )
        await caddy.add_proxy(
            f"{self.config.protocol.value}://aoc.{self.config.domain}",
            "automation-operation-centre:3000"
        )
        await caddy.add_proxy(
            f"{self.config.protocol.value}://api.{self.config.domain}",
            "aoc-bitswan-backend:8000"
        )
        await caddy.add_proxy(
            f"{self.config.protocol.value}://mqtt.{self.config.domain}",
            "aoc-emqx:1883"
        )
        await caddy.add_proxy(
            f"{self.config.protocol.value}://emqx.{self.config.domain}",
            "aoc-emqx:18083"
        )
        await caddy.add_proxy(
            f"{self.config.protocol.value}://influxdb.{self.config.domain}",
            "aoc-influxdb:8086"
        )


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

    def setup_etc_hosts(self) -> None:
        hosts = [
            f"aoc.{self.config.domain}",
            f"auth.{self.config.domain}",
            f"api.{self.config.domain}",
            f"mqtt.{self.config.domain}",
            f"emqx.{self.config.domain}",
            f"influxdb.{self.config.domain}",
        ]
    
        # remove hosts from hosts list that are already in the etc/hosts file
        with open("/etc/hosts", "r") as f:
            for line in f:
                for host in hosts:
                    if host in line:
                        hosts.remove(host)
        # try to add records with sudo
        try:
            for host in hosts:
                subprocess.run(
                    ["sudo", "sh", "-c", f"echo '127.0.0.1 {host}' >> /etc/hosts"],
                    check=True,
                )
        except subprocess.CalledProcessError:
            print("Failed to add hosts to /etc/hosts")
            print("Please add the following to /etc/hosts:")
            for host in hosts:
                print(f"127.0.0.1 {host}")
        print("hosts added to /etc/hosts")

    def generate_certs(self) -> None:
        # check if certs for bitswan.local are already in $HOME/.config/bitswan/caddy/certs/bitswan.local
        caddy_dir = Path.home() / ".config" / "bitswan" / "caddy"

        domain_certs_dir = caddy_dir / "certs" / "bitswan.local"
        certs_dir = caddy_dir / "certs"

        if domain_certs_dir.exists():
            print("Certs already exist")
            return

        if not certs_dir.exists():
            os.makedirs(certs_dir)
        
        if not domain_certs_dir.exists():
            os.makedirs(domain_certs_dir)


        print("Generating certs")
        subprocess.run(
            ["mkcert", "*.bitswan.local"],
            cwd=domain_certs_dir,
            check=True,
        )

        # rename the certs to full-chain.pem and private-key.pem
        os.rename("_wildcard.bitswan.local-key.pem", "private-key.pem", cwd=domain_certs_dir)
        os.rename("_wildcard.bitswan.local.pem", "full-chain.pem", cwd=domain_certs_dir)
        print("Certs generated")

