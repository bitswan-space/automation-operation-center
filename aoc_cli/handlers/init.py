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


class InitCommand:
    def __init__(self, config: InitConfig, continue_from_config: bool = False):
        self.config = config
        self.continue_from_config = continue_from_config

    async def execute(self) -> None:
        # Check if 'aoc' workspace already exists
        result = subprocess.run(
            ["bitswan", "workspace", "list"], capture_output=True, text=True
        )

        # Only run init if 'aoc' is not found in the output
        if "aoc" not in result.stdout:
            subprocess.run(
                [
                    "bitswan",
                    "workspace",
                    "init",
                    "--domain",
                    "app.bitswan.ai",
                    "aoc",
                ],
            )
        self.create_aoc_directory()
        self.copy_config_files()
        self.replace_docker_compose_services_versions()

        # Skip secrets setup if continuing from config
        if not self.continue_from_config:
            self.setup_secrets()

        caddy = CaddyService(self.config)
        keycloak_confirm = click.confirm(
            "\n\nDo you want to setup Keycloak?", default=True, abort=False
        )
        if keycloak_confirm:
            await caddy.add_proxy(
                f"keycloak.{self.config.domain}",
                "aoc-keycloak:8080",
            )
            self.setup_keycloak()

        influxdb_confirm = click.confirm(
            "\n\nDo you want to setup InfluxDB?", default=True, abort=False
        )
        if influxdb_confirm:
            self.setup_influxdb()

        await caddy.add_proxy(
            f"aoc.{self.config.domain}",
            "aoc:3000",
        )
        await caddy.add_proxy(
            f"api.{self.config.domain}",
            (
                "aoc-bitswan-backend:5000"
            ),
        )
        await caddy.add_proxy(
            f"mqtt.{self.config.domain}",
            "aoc-emqx:8083",
        )
        await caddy.add_proxy(
            f"emqx.{self.config.domain}",
            "aoc-emqx:18083",
        )
        caddy.restart()

        click.echo("AOC initialized successfully!")

        
        click.echo("Starting AOC")
        # Run 'docker compose up -d'
        subprocess.run(
            ['docker', 'compose', 'up', '-d'],
            check=True,
            cwd=self.config.aoc_dir,
        )

        access_message = f"""
        Access the AOC at the url {self.config.protocol.value}://aoc.{self.config.domain}"""

        if self.config.env == Environment.DEV:
            access_message = f"""
        cd to the nextjs directory and run:
        pnpm dev

        and

        Access the AOC at the url http://localhost:3000
        """

        click.echo(access_message)

    def create_aoc_directory(self) -> None:
        self.config.aoc_dir.mkdir(parents=True, exist_ok=True)

    def copy_config_files(self) -> None:
        template_path = (
            Path(__file__).parent.parent
            / "templates"
            / "docker-compose"
            / "docker-compose.yml"
        )
        if not template_path.exists():
            raise FileNotFoundError(f"Template not found: {template_path}")

        dest_path = self.config.aoc_dir / "docker-compose.yml"
        shutil.copy2(template_path, dest_path)

        emqx_config_path = (
            Path(__file__).parent.parent / "templates" / "emqx" / "emqx.conf"
        )
        if not emqx_config_path.exists():
            raise FileNotFoundError(f"Emqx config not found: {emqx_config_path}")

        os.makedirs(self.config.aoc_dir / "emqx", exist_ok=True)
        shutil.copy2(emqx_config_path, self.config.aoc_dir / "emqx" / "emqx.conf")

    def replace_docker_compose_services_versions(self) -> None:
        click.echo("Finding latest versions for AOC services")

        # Read the docker-compose.yml file using yaml
        with open(self.config.aoc_dir / "docker-compose.yml", "r") as f:
            docker_compose = yaml.safe_load(f)

        # get latest version from Docker Hub
        services: list[tuple[str, str]] = []

        docker_compose["services"]["bitswan-backend"]["environment"] = {}

        # Add service only if image wasn't provided through config
        if self.config.aoc_be_image:
            docker_compose["services"]["bitswan-backend"][
                "image"
            ] = self.config.aoc_be_image
            docker_compose["services"]["bitswan-backend"]["environment"][
                "BITSWAN_BACKEND_VERSION"] = self.config.aoc_be_image.split(":")[-1]
        else: 
            services.append((
                "bitswan-backend",
                "https://hub.docker.com/v2/repositories/bitswan/bitswan-backend/tags/",
            ))

        if self.config.aoc_image:
            docker_compose["services"]["aoc"]["image"] = self.config.aoc_image
            docker_compose["services"]["bitswan-backend"]["environment"][
                "AOC_VERSION"] = self.config.aoc_image.split(":")[-1]
        else: 
            services.append((
                "aoc",
                "https://hub.docker.com/v2/repositories/bitswan/automation-operations-centre/tags/",
            ))

        # Replace the services versions
        for service in services:
            service_name, url = service
            response = requests.get(url)
            if response.status_code == 200:
                results = response.json()["results"]
                pattern = r"\d{4}-\d+-git-[a-fA-F0-9]+$"
                latest_version = next(
                    (
                        version
                        for version in results
                        if re.match(pattern, version["name"])
                    ),
                    None,
                )
                if latest_version:
                    click.echo(
                        f"Found latest version for {service_name}: {latest_version['name']}"
                    )
                    self.change_version(docker_compose, service_name, latest_version['name'])
                else:
                    click.echo(f"No latest version found for {service_name}")
                    self.change_version(docker_compose, service_name, "latest")

        # Write the updated docker-compose.yml file
        with open(self.config.aoc_dir / "docker-compose.yml", "w") as f:
            yaml.dump(docker_compose, f)

    def change_version(self, docker_compose, service_name, latest_version):
        """Helper method to change docker compose service version"""
        image = docker_compose["services"][service_name]["image"].split(":")
        image[-1] = latest_version
        docker_compose["services"][service_name]["image"] = ":".join(image)

        # Add version as env to bitswan-backend service
        docker_compose["services"]["bitswan-backend"]["environment"][
            service_name.upper().replace("-", "_") + "_VERSION"] = latest_version

    def setup_keycloak(self) -> None:
        keycloak_config = KeycloakConfig(
            admin_username=self.config.admin_email,
            admin_password=self.config.admin_password,
            aoc_dir=self.config.aoc_dir,
            org_name=self.config.org_name,
            env=self.config.env,
            server_url=(
                f"https://keycloak.{self.config.domain}"
            ),
            keycloak_smtp_username=self.config.keycloak_smtp_username,
            keycloak_smtp_password=self.config.keycloak_smtp_password,
            keycloak_smtp_host=self.config.keycloak_smtp_host,
            keycloak_smtp_from=self.config.keycloak_smtp_from,
            keycloak_smtp_port=self.config.keycloak_smtp_port,
        )

        keycloak = KeycloakService(keycloak_config)
        keycloak.setup()

    def setup_influxdb(self) -> None:
        print("Initializing InfluxDB")

        influxdb = InfluxDBService(self.config)
        influxdb.setup()

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

        secrets_file = self.config.aoc_dir / "secrets.json"
        if secrets_file.exists():
            with open(secrets_file, "r") as f:
                secrets = json.load(f)
                vars.update(secrets)
        else:
            vars = self.generate_secrets(vars)

        bootstrap_services(self.config, vars)
