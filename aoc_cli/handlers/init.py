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
from aoc_cli.env.utils import get_env_path
from aoc_cli.utils.env import get_env_value, get_env_map
from aoc_cli.env.variables import get_var_defaults
from aoc_cli.services.ingress import IngressService
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

        ingress = IngressService(self.config)
        await ingress.add_proxy(
            f"keycloak.{self.config.domain}",
            "aoc-keycloak:8080",
        )
        self.setup_keycloak()

        self.setup_influxdb()

        await ingress.add_proxy(
            f"aoc.{self.config.domain}",
            "aoc:3000",
        )
        await ingress.add_proxy(
            f"api.{self.config.domain}",
            (
                "aoc-bitswan-backend:5000"
            ),
        )
        await ingress.add_proxy(
            f"mqtt.{self.config.domain}",
            "aoc-emqx:8083",
        )
        await ingress.add_proxy(
            f"emqx.{self.config.domain}",
            "aoc-emqx:18083",
        )
        ingress.restart()

        click.echo("AOC initialized successfully!")

        
        click.echo("Starting AOC")
        # Run 'docker compose up -d'
        subprocess.run(
            ['docker', 'compose', 'up', '-d'],
            check=True,
            cwd=self.config.aoc_dir,
        )

        # Build comprehensive access message with env vars and Keycloak info
        try:
            ops_env_path = get_env_path(self.config.aoc_dir, "Operations Centre")
            keycloak_env_path = get_env_path(self.config.aoc_dir, "keycloak")

            keycloak_admin_url = f"{self.config.protocol.value}://keycloak.{self.config.domain}"

            # Read admin creds from generated env file
            admin_username = get_env_value(keycloak_env_path, "KEYCLOAK_ADMIN") or "admin"
            admin_password = get_env_value(keycloak_env_path, "KEYCLOAK_ADMIN_PASSWORD") or "<not found>"

            # Build Keycloak admin info section
            keycloak_info = f"""
        Keycloak Admin Console:
        URL: {keycloak_admin_url}
        Admin user: {admin_username}
        Admin password: {admin_password}"""

            if self.config.env == Environment.DEV:
                # Generate local development environment file for Next.js
                from aoc_cli.env.services import bootstrap_nextjs_local
                from aoc_cli.env.variables import get_var_defaults
                
                # Get environment variables with localhost URLs for Next.js
                local_vars = get_var_defaults(self.config)


                # Pull values already written into service envs where relevant
                try:
                    # operations-centre.env contains AUTH_SECRET and EMQX_JWT_SECRET once bootstrap ran
                    ops_env_path = get_env_path(self.config.aoc_dir, "Operations Centre")
                    ops_env = get_env_map(ops_env_path)
                    local_vars.update({
                        "AUTH_SECRET": ops_env.get("AUTH_SECRET", local_vars.get("AUTH_SECRET")),
                        "EMQX_AUTHENTICATION__1__SECRET": ops_env.get("EMQX_JWT_SECRET", local_vars.get("EMQX_AUTHENTICATION__1__SECRET")),
                        "EMQX_JWT_SECRET": ops_env.get("EMQX_JWT_SECRET", local_vars.get("EMQX_JWT_SECRET")),
                    })
                except Exception:
                    pass
                try:
                    # Influx token is generated during influx setup
                    aoc_env_path = self.config.aoc_dir / "envs" / "aoc.env"
                    aoc_env = get_env_map(aoc_env_path)
                    if aoc_env.get("INFLUXDB_TOKEN"):
                        local_vars["INFLUXDB_TOKEN"] = aoc_env["INFLUXDB_TOKEN"]
                except Exception:
                    pass
                try:
                    # Keycloak client secret is written into operations-centre and bitswan-backend envs
                    keycloak_env_path = get_env_path(self.config.aoc_dir, "keycloak")
                    # not needed here but keep placeholder for future
                    be_env_path = get_env_path(self.config.aoc_dir, "Bitswan Backend")
                    ops_env_path = get_env_path(self.config.aoc_dir, "Operations Centre")
                    ops_env = get_env_map(ops_env_path)
                    candidate = ops_env.get("KEYCLOAK_CLIENT_SECRET") or ops_env.get("KEYCLOAK_CLIENT_SECRET_KEY")
                    if candidate:
                        local_vars["KEYCLOAK_CLIENT_SECRET"] = candidate
                except Exception:
                    pass
 
                # Create a temporary config for local development
                local_config = self.config
                local_config.aoc_dir = self.config.aoc_dir / "local"
                local_config.aoc_dir.mkdir(exist_ok=True)
 
                # Bootstrap the local Next.js environment
                bootstrap_nextjs_local(local_config, local_vars)
 
                # Copy the generated local env file to nextjs directory
                project_root = Path(__file__).parent.parent.parent
                nextjs_env_path = project_root / "nextjs" / ".env.local"
                local_env_path = local_config.aoc_dir / "envs" / "next.js-local-development.env"
                
                try:
                    shutil.copy2(local_env_path, nextjs_env_path)
                    click.echo(f"✓ Created local development environment file at {nextjs_env_path}")
                except Exception as copy_error:
                    click.echo(f"⚠️  Could not create local env file: {copy_error}")
                    click.echo(f"   Please manually copy {ops_env_path} to nextjs/.env.local and update URLs to localhost")

                access_message = f"""
        Next.js Development Setup:
        cd to the nextjs directory and run:
        pnpm install
        pnpm dev

        Access the AOC at: http://localhost:3000{keycloak_info}
        """
            else:
                access_message = f"""
        Access the AOC at: {self.config.protocol.value}://aoc.{self.config.domain}{keycloak_info}
        """

            click.echo(access_message)
        except Exception as e:
            # Fallback to basic message if env file reading fails
            if self.config.env == Environment.DEV:
                access_message = f"""
        cd to the nextjs directory and run:
        pnpm dev

        Access the AOC at: http://localhost:3000
        """
            else:
                access_message = f"""
        Access the AOC at: {self.config.protocol.value}://aoc.{self.config.domain}
        """
            click.echo(access_message)
            click.echo(f"Note: Unable to print Keycloak admin info: {e}")

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
        # Use localhost for development to avoid DNS resolution issues with .localhost domains
        if self.config.env == Environment.DEV:
            server_url = "http://localhost:8080"
        else:
            server_url = f"https://keycloak.{self.config.domain}"
            
        keycloak_config = KeycloakConfig(
            admin_username=self.config.admin_email,
            admin_password=self.config.admin_password,
            aoc_dir=self.config.aoc_dir,
            org_name=self.config.org_name,
            env=self.config.env,
            server_url=server_url,
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
        secrets_map = (
            ("KC_DB_PASSWORD",),
            ("BITSWAN_BACKEND_POSTGRES_PASSWORD",),
            ("INFLUXDB_PASSWORD", "DOCKER_INFLUXDB_INIT_PASSWORD"),
            ("INFLUXDB_TOKEN",),
            ("AUTH_SECRET",),
            ("KC_BOOTSTRAP_ADMIN_PASSWORD", "KEYCLOAK_ADMIN_PASSWORD"),
            ("CCS_CONFIG_KEY",),
            ("EMQX_DASHBOARD__DEFAULT_PASSWORD",),
            ("EMQX_USER",),
            ("DJANGO_SECRET_KEY",),
            ("AUTH_SECRET_KEY",),
            ("EMQX_AUTHENTICATION__1__SECRET",),
        )        

        for secret_tuple in secrets_map:
            secret = generate_secret()
            for key in secret_tuple:
                vars[key] = secret
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
