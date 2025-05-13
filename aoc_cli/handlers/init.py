import json
import os
import re
import shutil
import subprocess
from pathlib import Path
from typing import Dict

import click
import requests
import yaml

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
        if self.config.caddy:
            await self.setup_caddy()

        self.create_aoc_directory()
        self.copy_config_files()

        if self.config.env == Environment.PROD:
            self.replace_docker_compose_services_versions()

        self.setup_secrets()

        keycloak_confirm = click.confirm(
            "\n\nDo you want to setup Keycloak?", default=True, abort=False
        )
        if keycloak_confirm:
            self.setup_keycloak()

        influxdb_confirm = click.confirm(
            "\n\nDo you want to setup InfluxDB?", default=True, abort=False
        )
        if influxdb_confirm:
            self.setup_influxdb()

        self.cleanup()

        aoc_working_dir = get_aoc_working_directory(
            self.config.env, self.config.aoc_dir
        )
        click.echo("AoC initialized successfully!")

        if self.config.local:
            self.setup_local_prod_host()

        if self.config.env == Environment.PROD:
            click.echo(
                f"You can launch the aoc by going to {aoc_working_dir} and running `docker-compose up -d`"
            )

            aoc_url = f"{self.config.protocol.value}://aoc.{self.config.domain}" if not self.config.local else "http://localhost:3000"

            access_message = f"""
            Access the AOC at the url {aoc_url}"""

        if self.config.env == Environment.DEV:
            access_message = f"""
            Run the following command to start the AOC:

                docker compose -f ./deployment/docker-compose.{self.config.env.value}.yml up -d

            cd to the nextjs directory and run:
            pnpm dev

            and

            Access the AOC at the url http://localhost:3000
            """

        click.echo(access_message)

    def setup_local_prod_host(self) -> None:
        hosts = [
            "aoc-keycloak",
            "aoc-bitswan-backend",
        ]

        with open("/etc/hosts", "r") as f:
            for line in f:
                for host in hosts:
                    if host in line:
                        hosts.remove(host)

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
                click.echo(f"127.0.0.1 {host}")
        click.echo("hosts added to /etc/hosts")


    def create_aoc_directory(self) -> None:
        self.config.aoc_dir.mkdir(parents=True, exist_ok=True)

    def copy_config_files(self) -> None:
        template_path = (
            Path(__file__).parent.parent
            / "templates"
            / self.config.env.value
            / ("docker-compose.yml" if not self.config.local else "docker-compose.local.yml")
        )
        if not template_path.exists():
            raise FileNotFoundError(f"Template not found: {template_path}")

        dest_path = self.config.aoc_dir / "docker-compose.yml"
        shutil.copy2(template_path, dest_path)

        emqx_config_path = (
            Path(__file__).parent.parent
            / "templates"
            / "emqx"
            / "emqx.conf"
        )
        if not emqx_config_path.exists():
            raise FileNotFoundError(f"Emqx config not found: {emqx_config_path}")

        os.makedirs(self.config.aoc_dir / "emqx", exist_ok=True)
        shutil.copy2(emqx_config_path, self.config.aoc_dir / "emqx" / "emqx.conf")

    def replace_docker_compose_services_versions(self) -> None:
        click.echo("Finding latest versions for AOC services")
        cwd = get_aoc_working_directory(self.config.env, self.config.aoc_dir)

        # Read the docker-compose.yml file using yaml
        with open(cwd / "docker-compose.yml", "r") as f:
            docker_compose = yaml.safe_load(f)

        # get latest version from Docker Hub
        services = [
            ("keycloak", "https://hub.docker.com/v2/repositories/bitswan/bitswan-keycloak/tags/"),
            ("bitswan-backend", "https://hub.docker.com/v2/repositories/bitswan/bitswan-backend/tags/"),
            ("profile-manager", "https://hub.docker.com/v2/repositories/bitswan/profile-manager/tags/"),
            ("aoc", "https://hub.docker.com/v2/repositories/bitswan/automation-operations-centre/tags/"),
        ]

        if self.config.aoc_be_image:
            docker_compose["services"]["bitswan-backend"]["image"] = self.config.aoc_be_image
        if self.config.aoc_image:
            docker_compose["services"]["aoc"]["image"] = self.config.aoc_image
        if self.config.profile_manager_image:
            docker_compose["services"]["profile-manager"]["image"] = self.config.profile_manager_image

        # Replace the services versions
        for service in services:
            service_name, url = service
            response = requests.get(url)
            if response.status_code == 200:
                results = response.json()["results"]
                pattern = r"\d{4}-\d+-git-[a-fA-F0-9]+$"
                latest_version = next((version for version in results if re.match(pattern, version["name"])), None)
                service = docker_compose["services"][service_name]
                if latest_version:
                    click.echo(f"Found latest version for {service_name}: {latest_version['name']}")
                    service["image"] = service["image"].replace("<slug>", latest_version["name"])
                    docker_compose["services"][service_name] = service
                else:
                    click.echo(f"No latest version found for {service_name}")
                    service["image"] = service["image"].replace("<slug>", "latest")
                    docker_compose["services"][service_name] = service

        # Write the updated docker-compose.yml file
        with open(cwd / "docker-compose.yml", "w") as f:
            yaml.dump(docker_compose, f)

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

        if self.config.certs:
            self.generate_certs()
            await caddy.load_certs()

        await caddy.add_proxy(
            f"keycloak.{self.config.domain}",
            "aoc-keycloak:8080",
        )
        await caddy.add_proxy(
            f"aoc.{self.config.domain}",
            "aoc:3000",
        )
        await caddy.add_proxy(
            f"api.{self.config.domain}",
            "aoc-bitswan-backend:5000" if self.config.env == Environment.PROD else "aoc-bitswan-backend:8000",
        )
        await caddy.add_proxy(
            f"mqtt.{self.config.domain}",
            "aoc-emqx:8084",
        )
        await caddy.add_proxy(
            f"emqx.{self.config.domain}",
            "aoc-emqx:18083",
        )

    def generate_certs(self) -> None:
        # check if certs for bitswan.local are already in $HOME/.config/bitswan/caddy/certs/bitswan.local
        caddy_dir = Path.home() / ".config" / "bitswan" / "caddy"

        domain_certs_dir = caddy_dir / "certs" / self.config.domain
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
            ["mkcert", f"*.{self.config.domain}"],
            cwd=domain_certs_dir,
            check=True,
        )

        # rename the certs to full-chain.pem and private-key.pem
        os.rename(os.path.join(domain_certs_dir, f"_wildcard.{self.config.domain}-key.pem"), os.path.join(domain_certs_dir, "private-key.pem"))
        os.rename(os.path.join(domain_certs_dir, f"_wildcard.{self.config.domain}.pem"), os.path.join(domain_certs_dir, "full-chain.pem"))
        print("Certs generated")

    def cleanup(self) -> None:
        cwd = get_aoc_working_directory(self.config.env, self.config.aoc_dir)
        subprocess.run(
            [
                "docker",
                "compose",
                "-f",
                f"docker-compose.yml" if self.config.env == Environment.PROD else f"docker-compose.{self.config.env.value}.yml",
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