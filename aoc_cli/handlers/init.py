import json
import os
import re
import shutil
import subprocess
from pathlib import Path
from typing import Dict
from dotenv import set_key

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
        if self.config.env == Environment.PROD:
            self.replace_docker_compose_services_versions()

        self.setup_secrets()

        caddy = CaddyService(self.config)
        keycloak_confirm = click.confirm(
            "\n\nDo you want to setup Keycloak?", default=True, abort=False
        )
        if keycloak_confirm:
            if self.config.env == Environment.PROD:
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

        if self.config.env == Environment.PROD:
            await caddy.add_proxy(
                f"aoc.{self.config.domain}",
                "aoc:3000",
            )
            await caddy.add_proxy(
                f"api.{self.config.domain}",
                (
                    "aoc-bitswan-backend:5000"
                    if self.config.env == Environment.PROD
                    else "aoc-bitswan-backend:8000"
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

    def copy_config_files(self) -> None:
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

        emqx_config_path = (
            Path(__file__).parent.parent / "templates" / "emqx" / "emqx.conf"
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
            (
                "keycloak",
                "https://hub.docker.com/v2/repositories/bitswan/bitswan-keycloak/tags/",
            )
        ]

        # list of env key and version of each service
        versions: list[tuple[str, str]] = []

        # Add service only if image wasn't provided through config
        if self.config.aoc_be_image:
            docker_compose["services"]["bitswan-backend"][
                "image"
            ] = self.config.aoc_be_image
            versions.append(("BITSWAN_BACKEND_VERSION", self.config.aoc_be_image.split(":")[-1]))
        else: 
            services.append((
                "bitswan-backend",
                "https://hub.docker.com/v2/repositories/bitswan/bitswan-backend/tags/",
            ))

        if self.config.aoc_image:
            docker_compose["services"]["aoc"]["image"] = self.config.aoc_image
            versions.append(("AOC_VERSION", self.config.aoc_image.split(":")[-1]))
        else: 
            services.append((
                "aoc",
                "https://hub.docker.com/v2/repositories/bitswan/automation-operations-centre/tags/",
            ))

        if self.config.profile_manager_image:
            docker_compose["services"]["profile-manager"][
                "image"
            ] = self.config.profile_manager_image
            versions.append(("PROFILE_MANAGER_VERSION", self.config.profile_manager_image.split(":")[-1]))
        else:
            services.append((
                "profile-manager",
                "https://hub.docker.com/v2/repositories/bitswan/profile-manager/tags/",
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
                    self.change_version(docker_compose, service_name, latest_version['name'], versions)
                else:
                    click.echo(f"No latest version found for {service_name}")
                    self.change_version(docker_compose, service_name, "latest", versions)                    

        # Write the updated docker-compose.yml file
        with open(cwd / "docker-compose.yml", "w") as f:
            yaml.dump(docker_compose, f)
        
        # Set/update the version environment variables 
        for service, version in versions:
            set_key(cwd /  "envs" / "bitswan-backend.env", service, version)

    def change_version(self, docker_compose, service_name, latest_version, versions):
        """Helper method to change docker compose service version"""
        image = docker_compose["services"][service_name]["image"].split(":")
        image[-1] = latest_version
        docker_compose["services"][service_name]["image"] = ":".join(image)
        versions.append((service_name.upper().replace("-", "_") + "_VERSION", latest_version))

    def setup_keycloak(self) -> None:
        keycloak_config = KeycloakConfig(
            admin_username=self.config.admin_email,
            admin_password=self.config.admin_password,
            aoc_dir=self.config.aoc_dir,
            org_name=self.config.org_name,
            env=self.config.env,
            dev_setup=self.config.dev_setup,
            server_url=(
                f"https://keycloak.{self.config.domain}"
                if self.config.env == Environment.PROD
                else "http://localhost:8080"
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
