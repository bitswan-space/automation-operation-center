import asyncio
import json
from operator import truediv
import os
import re
import shutil
import subprocess
from pathlib import Path
from typing import Dict

import click
import requests
import yaml

from aoc_cli.env.config import Environment, InitConfig, Protocol
from aoc_cli.env.services import write_env_files
from aoc_cli.env.utils import get_env_path
from aoc_cli.utils.env import get_env_value
from aoc_cli.env.variables import get_var_defaults
from aoc_cli.services.ingress import IngressService
from aoc_cli.services.influxdb import InfluxDBService
from aoc_cli.services.keycloak import KeycloakConfig, KeycloakService
from aoc_cli.utils.secrets import generate_secret
from aoc_cli.utils.images import resolve_images, replace_docker_compose_services_versions


def check_command_exists(command: str) -> bool:
    """Check if a command exists in the system PATH."""
    return shutil.which(command) is not None


def check_dependencies() -> None:
    """Check for required dependencies and provide installation instructions if missing."""
    missing_deps = []
    
    # Check for bitswan CLI
    if not check_command_exists("bitswan"):
        missing_deps.append(("bitswan", get_bitswan_installation_instructions()))
    
    # Check for Docker
    if not check_command_exists("docker"):
        missing_deps.append(("docker", get_docker_installation_instructions()))

    if missing_deps:
        click.echo("❌ Missing required dependencies:")
        click.echo()
        
        for dep_name, instructions in missing_deps:
            click.echo(f"Missing: {dep_name}")
            click.echo(instructions)
            click.echo()
        
        click.echo("Please install the missing dependencies and try again.")
        raise click.Abort()


def get_bitswan_installation_instructions() -> str:
    """Get installation instructions for bitswan CLI."""
    return """Install bitswan CLI from: https://github.com/bitswan-space/bitswan-automation-server
"""


def get_docker_installation_instructions() -> str:
    """Get installation instructions for Docker."""
    return """Install Docker from: https://docs.docker.com/get-docker/

For Linux:
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

For macOS:
Download Docker Desktop from: https://www.docker.com/products/docker-desktop/

For Windows:
Download Docker Desktop from: https://www.docker.com/products/docker-desktop/"""


def is_in_automation_center_repo() -> bool:
    """Check if we're currently in the automation center git repository."""
    try:
        # Get the git root directory
        result = subprocess.run(
            ["git", "rev-parse", "--show-toplevel"],
            capture_output=True,
            text=True,
            check=True
        )
        git_root = Path(result.stdout.strip())
        
        # Check if this is the automation center repo by looking for key files/directories
        # Look for django directory and other characteristic files
        django_dir = git_root / "django"
        aoc_frontend_dir = git_root / "aoc-frontend"
        aoc_cli_dir = git_root / "aoc_cli"
        
        return (django_dir.exists() and 
                aoc_frontend_dir.exists() and 
                aoc_cli_dir.exists() and
                (git_root / "README.md").exists())
    except (subprocess.CalledProcessError, FileNotFoundError):
        return False




@click.command()
@click.argument(
    "output_dir",
    required=False,
    default=Path.home() / ".config" / "bitswan" / "aoc",
    type=click.Path(exists=False, writable=True, file_okay=False, resolve_path=True),
)
@click.option("--overwrite", is_flag=True, help="Overwrite existing files")
@click.option("--env-file", type=click.Path(exists=True), help="Path to .env file")
@click.option("--interactive", is_flag=True, help="Enable interactive mode")
@click.option(
    "--env",
    type=click.Choice(["dev", "prod", "staging"]),
    help="Deployment environment",
)
@click.option("--domain", type=str, help="Domain")
@click.option("--protocol", type=click.Choice(["http", "https"]), help="Protocol")
@click.option("--admin-email", type=str, help="Admin email")
@click.option("--org-name", type=str, help="Organization name")
@click.option("--aoc-be-image", type=str, help="AOC BE docker image")
@click.option("--aoc-image", type=str, help="AOC FE docker image")
@click.option("--keycloak-image", type=str, help="Keycloak docker image")
@click.option("--keycloak-smtp-username", type=str, help="Keycloak SMTP username")
@click.option("--keycloak-smtp-password", type=str, help="Keycloak SMTP password")
@click.option("--keycloak-smtp-host", type=str, help="Keycloak SMTP host")
@click.option("--keycloak-smtp-from", type=str, help="Keycloak SMTP from")
@click.option("--keycloak-smtp-port", type=str, help="Keycloak SMTP port")
@click.option(
    "--dev",
    is_flag=True,
    help="Use development environment defaults (sets env=dev, domain=bitswan.localhost, protocol=https, etc.)",
)
@click.option(
    "--continue",
    "continue_from_config",
    is_flag=True,
    help="Continue from existing config file without recreating environment files",
)
@click.option(
    "--mkcerts",
    is_flag=True,
    help="Automatically generate local certificates using the mkcerts utility",
)
@click.option(
    "--certs-dir",
    type=click.Path(exists=True, file_okay=False, dir_okay=True),
    help="The directory where the certificates are located",
)
@click.option("--from", "from_url", type=str, help="URL endpoint returning versions for update")
def init(
    *args, 
    **kwargs,
):
    asyncio.run(init_async(*args, **kwargs))


async def init_async(
    output_dir,
    env_file,
    overwrite,
    dev,
    continue_from_config,
    **kwargs,
):
    """Initialize the Automation Operations Center (AOC)."""
    
    # Convert output_dir to Path object if it's a string
    if isinstance(output_dir, str):
        output_dir = Path(output_dir)
    
    # Check for required dependencies first
    check_dependencies()
    
    # Handle continue from config for both dev and non-dev modes
    if continue_from_config:
        try:
            init_config = InitConfig.load_from_yaml()
            click.echo("Loaded configuration from existing config file.")
            await execute_init(init_config, continue_from_config=continue_from_config)
            return
        except FileNotFoundError:
            click.echo("Error: No existing config file found. Run without --continue first.")
            return
    
    # Build configuration using InitConfig methods
    click.echo("Initializing AoC...\n")
    
    try:
        if dev:

            #build the frontend dev
            #the dockerfile is called Dockerfile.dev
            pwd = os.getcwd()
            click.echo(f"Building frontend dev image... {pwd}")
            subprocess.run(
                ["docker", "build", "-t", "aoc-frontend-dev", "-f", "Dockerfile.dev", "."],
                check=True,
                cwd=os.path.join(pwd, "aoc-frontend"),
            )

            # Check if we're in the automation center git repo
            if not is_in_automation_center_repo():
                click.echo("Error: Dev mode can only be launched from within the automation center git repository.")
                click.echo("Please navigate to the automation center repository and try again.")
                return
            
            click.echo("\n\nInitializing AoC Dev environment...")
            
            if not kwargs.get("aoc_image"):
                kwargs["aoc_image"] = "aoc-frontend-dev"

            #0 Use the new dev config factory method
            init_config = InitConfig.create_dev_config(
                aoc_dir=output_dir,
                admin_email=kwargs.get("admin_email"),
                org_name=kwargs.get("org_name"),
                aoc_be_image=kwargs.get("aoc_be_image"),
                aoc_image=kwargs.get("aoc_image"), 
                keycloak_image=kwargs.get("keycloak_image"),
                mkcerts=True if not kwargs.get("certs_dir") else False,
                certs_dir=kwargs.get("certs_dir"),
            )
        else:
            # Production/non-dev flo
            # Use the new collect_configurations method
            init_config = InitConfig.collect_configurations(
                interactive=kwargs["interactive"],
                env=kwargs["env"],
                domain=kwargs["domain"],
                protocol=kwargs["protocol"],
                admin_email=kwargs["admin_email"],
                org_name=kwargs["org_name"],
                keycloak_smtp_username=kwargs["keycloak_smtp_username"],
                keycloak_smtp_password=kwargs["keycloak_smtp_password"],
                keycloak_smtp_host=kwargs["keycloak_smtp_host"],
                keycloak_smtp_from=kwargs["keycloak_smtp_from"],
                keycloak_smtp_port=kwargs["keycloak_smtp_port"],
                aoc_dir=output_dir,
                mkcerts=kwargs.get("mkcerts", False),
                certs_dir=kwargs.get("certs_dir"),
                from_url=kwargs.get("from_url"),
                aoc_be_image=kwargs.get("aoc_be_image"),
                aoc_image=kwargs.get("aoc_image"),
                keycloak_image=kwargs.get("keycloak_image"),
            )
            
            click.echo(f"env: {init_config.env.value}")
    except click.Abort:
        return
    
    
    # Always save config to YAML file
    init_config.save_to_yaml()
    click.echo("Configuration saved to config file.")
    
    await execute_init(init_config)



async def execute_init(config: InitConfig) -> None:
    """Execute the initialization process."""
    # Check if 'aoc' workspace already exists
    try:
        result = subprocess.run(
            ["bitswan", "workspace", "list"], capture_output=True, text=True, check=True
        )
    except subprocess.CalledProcessError as e:
        click.echo(f"❌ Error running bitswan workspace list: {e}")
        click.echo("Make sure bitswan CLI is properly installed and accessible.")
        raise click.Abort()
    except FileNotFoundError:
        click.echo("❌ bitswan command not found. Please install bitswan CLI first.")
        click.echo("Run the init command again after installing bitswan CLI.")
        raise click.Abort()

    try:
        subprocess.run(
            [
                "bitswan",
                "ingress",
                "init",
            ],
            check=True
        )
    except subprocess.CalledProcessError as e:
        click.echo(f"❌ Error initializing bitswan ingress: {e}")
        click.echo("Make sure bitswan CLI is properly installed and accessible.")
        raise click.Abort()
    except FileNotFoundError:
        click.echo("❌ bitswan command not found. Please install bitswan CLI first.")
        click.echo("Run the init command again after installing bitswan CLI.")
        raise click.Abort()
    create_aoc_directory(config)
    copy_config_files(config)
    # 1) Resolve images (fill in config image fields if missing)
    resolve_images(config)
    # 2) Update docker-compose images only (env handled by env service)
    replace_docker_compose_services_versions(config)

    setup_env_vars(config)

    ingress = IngressService(config)
    await ingress.add_proxy(
        f"keycloak.{config.domain}",
        "aoc-keycloak:8080",
    )
    setup_keycloak(config)

    setup_influxdb(config)

    # Configure frontend proxy - always use port 3000 for dev, port 80 for prod
    frontend_port = "3000" if config.env == Environment.DEV else "80"
    await ingress.add_proxy(
        f"aoc.{config.domain}",
        f"aoc-frontend:{frontend_port}",
    )
    await ingress.add_proxy(
        f"api.{config.domain}",
        (
            "aoc-bitswan-backend:8000"
        ),
    )
    await ingress.add_proxy(
        f"mqtt.{config.domain}",
        "aoc-emqx:8083",
    )
    await ingress.add_proxy(
        f"emqx.{config.domain}",
        "aoc-emqx:18083",
    )
    ingress.restart()

    click.echo("AOC initialized successfully!")

    
    click.echo("Starting AOC")
    # Run 'docker compose up -d'
    try:
        subprocess.run(
            ['docker', 'compose', 'up', '-d'],
            check=True,
            cwd=config.aoc_dir,
        )
    except subprocess.CalledProcessError as e:
        click.echo(f"❌ Error starting Docker containers: {e}")
        click.echo("Make sure Docker and Docker Compose are properly installed and running.")
        raise click.Abort()
    except FileNotFoundError:
        click.echo("❌ docker command not found. Please install Docker first.")
        click.echo("Run the init command again after installing Docker.")
        raise click.Abort()

    if config.env == Environment.DEV:
        click.echo("Connecting caddy to bitswan_network with keycloak.bitswan.localhost alias...")
        try:
            # Always disconnect first (quietly)
            subprocess.run(
                ["docker", "network", "disconnect", "bitswan_network", "caddy"],
                check=False,
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
            )

            # Then reconnect with both aliases
            subprocess.run(
                [
                    "docker", "network", "connect",
                    "--alias", "caddy",
                    "--alias", "keycloak.bitswan.localhost",
                    "bitswan_network",
                    "caddy"
                ],
                check=True,
            )
            click.echo("✓ Caddy connected to bitswan_network with keycloak.bitswan.localhost alias")
        except subprocess.CalledProcessError as e:
            click.echo(f"⚠️  Warning: Could not connect caddy to bitswan_network: {e}")

    # Build comprehensive access message with env vars and Keycloak info
    try:
        ops_env_path = get_env_path(config.aoc_dir, "Operations Centre")
        keycloak_env_path = get_env_path(config.aoc_dir, "keycloak")

        keycloak_admin_url = f"{config.protocol.value}://keycloak.{config.domain}"

        # Read admin creds from generated env file
        admin_username = get_env_value(keycloak_env_path, "KEYCLOAK_ADMIN") or "admin"
        admin_password = get_env_value(keycloak_env_path, "KEYCLOAK_ADMIN_PASSWORD") or "<not found>"

        # Build Keycloak admin info section
        keycloak_info = f"""
    Keycloak Admin Console:
    URL: {keycloak_admin_url}
    Admin user: {admin_username}
    Admin password: {admin_password}"""

        # Build AOC admin info section
        admin_password = get_secret_from_file(config, "ADMIN_PASSWORD")
        aoc_admin_info = f"""
    AOC Admin:
    Admin user: {config.admin_email}
    Admin password: {admin_password}"""

        access_message = f"""
    Setup Complete:
    - React frontend: {config.protocol.value}://aoc.{config.domain}
    - Django backend API: {config.protocol.value}://api.{config.domain}
    """
        
        if config.env == Environment.DEV:
            access_message += "    - Services are running in containers with source code mounted for live refresh\n"
        
        access_message += f"""
    {aoc_admin_info}

    {keycloak_info}
    """

        click.echo(access_message)
    except Exception as e:
        # Fallback to basic message if env file reading fails
        access_message = f"""
    Setup Complete:
    - React frontend: {config.protocol.value}://aoc.{config.domain}
    - Django backend API: {config.protocol.value}://api.{config.domain}
    """
        
        if config.env == Environment.DEV:
            access_message += "    - Services are running in containers with source code mounted for live refresh\n"
        click.echo(access_message)
        click.echo(f"Note: Unable to print Keycloak admin info: {e}")


def create_aoc_directory(config: InitConfig) -> None:
    config.aoc_dir.mkdir(parents=True, exist_ok=True)


def setup_keycloak(config: InitConfig) -> None:
    # Use localhost for development to avoid DNS resolution issues with .localhost domains
    if config.env == Environment.DEV:
        server_url = "http://localhost:8080"
    else:
        server_url = f"https://keycloak.{config.domain}"
        
    keycloak_config = KeycloakConfig(
        admin_username=config.admin_email,
        admin_password=get_secret_from_file(config, "ADMIN_PASSWORD"),
        aoc_dir=config.aoc_dir,
        org_name=config.org_name,
        env=config.env,
        server_url=server_url,
        keycloak_smtp_username=config.keycloak_smtp_username,
        keycloak_smtp_password=config.keycloak_smtp_password,
        keycloak_smtp_host=config.keycloak_smtp_host,
        keycloak_smtp_from=config.keycloak_smtp_from,
        keycloak_smtp_port=config.keycloak_smtp_port,
    )

    keycloak = KeycloakService(keycloak_config)
    keycloak.setup()


def setup_influxdb(config: InitConfig) -> None:
    print("Initializing InfluxDB")

    influxdb = InfluxDBService(config)
    influxdb.setup()


def get_secret_from_file(config: InitConfig, key: str) -> str:
    """Get a secret value from the secrets file."""
    secrets_file = config.aoc_dir / "secrets.json"
    if secrets_file.exists():
        with open(secrets_file, "r") as f:
            secrets = json.load(f)
        return secrets.get(key, "")
    return ""




def generate_secrets(vars: Dict[str, str]) -> Dict[str, str]:
    """Generate all required secrets, only filling in missing values.

    For groups of related keys, if any key already has a value, use that
    value for the rest of the group; otherwise generate a new secret for
    the entire group. Existing values are never overwritten.
    """
    secrets_map = (
        ("KC_DB_PASSWORD",),
        ("BITSWAN_BACKEND_POSTGRES_PASSWORD",),
        ("INFLUXDB_PASSWORD", "DOCKER_INFLUXDB_INIT_PASSWORD"),
        ("INFLUXDB_TOKEN",),
        ("AUTH_SECRET",),
        ("KC_BOOTSTRAP_ADMIN_PASSWORD", "KEYCLOAK_ADMIN_PASSWORD"),
        ("CCS_CONFIG_KEY",),
        ("EMQX_DASHBOARD__DEFAULT_PASSWORD",),
        ("DJANGO_SECRET_KEY",),
        ("AUTH_SECRET_KEY",),
        ("EMQX_AUTHENTICATION__1__SECRET",),
        ("ADMIN_PASSWORD",),
    )        

    for secret_tuple in secrets_map:
        # Reuse existing value within the group if present
        existing_value = next((vars.get(k) for k in secret_tuple if vars.get(k)), None)
        value_to_use = existing_value or generate_secret()
        for key in secret_tuple:
            if not vars.get(key):
                vars[key] = value_to_use
    return vars


def setup_env_vars(config: InitConfig) -> None:
    """Setup command implementation"""
    secrets = {}

    # Always ensure all required secrets exist but do not overwrite existing ones
    generate_secrets(secrets)

    secrets_file = config.aoc_dir / "secrets.json"
    if secrets_file.exists():
        with open(secrets_file, "r") as f:
            secrets = json.load(f)

    with open(secrets_file, "w") as f:
        json.dump(secrets, f, indent=2)

    vars = get_var_defaults(
        config,
    )

    vars.update(secrets)

    write_env_files(config, vars)


def copy_config_files(config: InitConfig) -> None:
    """Copy configuration files to the AOC directory."""
    # Get the path to the templates directory
    templates_dir = Path(__file__).parent.parent / "templates"
    
    # Copy docker-compose.yml template
    docker_compose_template = templates_dir / "docker-compose" / "docker-compose.yml"
    docker_compose_dest = config.aoc_dir / "docker-compose.yml"
    
    if docker_compose_template.exists():
        shutil.copy2(docker_compose_template, docker_compose_dest)
        click.echo(f"✓ Copied docker-compose.yml to {docker_compose_dest}")
    else:
        click.echo(f"⚠️  Template file not found: {docker_compose_template}")
    
    # Create emqx directory and copy emqx.conf template
    emqx_dir = config.aoc_dir / "emqx"
    emqx_dir.mkdir(exist_ok=True)
    
    emqx_template = templates_dir / "emqx" / "emqx.conf"
    emqx_dest = emqx_dir / "emqx.conf"
    
    if emqx_template.exists():
        shutil.copy2(emqx_template, emqx_dest)
        click.echo(f"✓ Copied emqx.conf to {emqx_dest}")
    else:
        click.echo(f"⚠️  Template file not found: {emqx_template}")
