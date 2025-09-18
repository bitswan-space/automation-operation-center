import asyncio
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

from aoc_cli.aoc_config import (
    collect_configurations,
    load_environment,
    validate_configurations,
)
from aoc_cli.env.config import Environment, InitConfig, Protocol
from aoc_cli.env.services import write_env_files
from aoc_cli.env.utils import get_env_path
from aoc_cli.utils.env import get_env_value, get_env_map
from aoc_cli.env.variables import get_var_defaults
from aoc_cli.services.ingress import IngressService
from aoc_cli.services.influxdb import InfluxDBService
from aoc_cli.services.keycloak import KeycloakConfig, KeycloakService
from aoc_cli.utils.secrets import generate_secret


def _is_in_automation_center_repo() -> bool:
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
        nextjs_dir = git_root / "nextjs"
        aoc_cli_dir = git_root / "aoc_cli"
        
        return (django_dir.exists() and 
                nextjs_dir.exists() and 
                aoc_cli_dir.exists() and
                (git_root / "README.md").exists())
    except (subprocess.CalledProcessError, FileNotFoundError):
        return False


def _find_django_directory() -> Path:
    """Find the django directory using absolute path from git repo root."""
    try:
        # Get the git root directory
        result = subprocess.run(
            ["git", "rev-parse", "--show-toplevel"],
            capture_output=True,
            text=True,
            check=True
        )
        git_root = Path(result.stdout.strip())
        django_dir = git_root / "django"
        
        if not django_dir.exists():
            raise FileNotFoundError("Django directory not found in git repository")
            
        return django_dir
    except (subprocess.CalledProcessError, FileNotFoundError) as e:
        raise RuntimeError(f"Could not find django directory: {e}")


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
@click.option("--admin-password", type=str, hide_input=True, help="Admin password")
@click.option("--org-name", type=str, help="Organization name")
@click.option("--aoc-be-image", type=str, help="AOC BE docker image")
@click.option("--aoc-image", type=str, help="AOC FE docker image")
@click.option("--profile-manager-image", type=str, help="Profile Manager docker image")
@click.option("--keycloak-image", type=str, help="Keycloak docker image")
@click.option("--keycloak-smtp-username", type=str, help="Keycloak SMTP username")
@click.option("--keycloak-smtp-password", type=str, help="Keycloak SMTP password")
@click.option("--keycloak-smtp-host", type=str, help="Keycloak SMTP host")
@click.option("--keycloak-smtp-from", type=str, help="Keycloak SMTP from")
@click.option("--keycloak-smtp-port", type=str, help="Keycloak SMTP port")
@click.option(
    "--dev",
    is_flag=True,
    help="Use development environment defaults (sets env=dev, domain=bitswan.localhost, protocol=http, etc.)",
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
@click.pass_context
def init(
    ctx,
    output_dir: Path,
    env_file,
    overwrite,
    dev,
    continue_from_config,
    mkcerts,
    certs_dir,
    **kwargs,
):
    asyncio.run(_init_async(ctx, output_dir, env_file, overwrite, dev, continue_from_config, mkcerts, certs_dir, **kwargs))


async def _init_async(
    ctx,
    output_dir: Path,
    env_file,
    overwrite,
    dev,
    continue_from_config,
    mkcerts,
    certs_dir,
    **kwargs,
):
    """Initialize the Automation Operations Center (AOC)."""
    
    if dev:
        # Check if we're in the automation center git repo
        if not _is_in_automation_center_repo():
            click.echo("Error: Dev mode can only be launched from within the automation center git repository.")
            click.echo("Please navigate to the automation center repository and try again.")
            return
        
        click.echo("\n\nInitializing AoC Dev environment...")
        
        if continue_from_config:
            try:
                init_config = InitConfig.load_from_yaml()
                click.echo("Loaded configuration from existing config file.")
                await execute_init(init_config, continue_from_config=continue_from_config)
                return
            except FileNotFoundError:
                click.echo("Error: No existing config file found. Run without --continue first.")
                return
        
        # Apply dev defaults when --dev flag is used
        dev_defaults = {
            "env": "dev",
            "domain": "bitswan.localhost", 
            "protocol": "http",
            "admin_email": kwargs.get("admin_email") or "admin@example.com",
            "admin_password": kwargs.get("admin_password") or generate_secret(),
            "org_name": kwargs.get("org_name") or "Example Org",
            "keycloak_smtp_username": "",
            "keycloak_smtp_password": "",
            "keycloak_smtp_port": "1025",
            "keycloak_smtp_host": "mailpit",
            "keycloak_smtp_from": "auth@bitswan.localhost",
        }
        
        # Merge user-provided options with dev defaults, prioritizing user input
        for key, default_value in dev_defaults.items():
            if kwargs.get(key) is None:
                kwargs[key] = default_value
        
        init_config = InitConfig(
            env=Environment(kwargs["env"]),
            aoc_dir=Path(output_dir),
            protocol=Protocol(kwargs["protocol"]),
            domain=kwargs["domain"],
            admin_email=kwargs["admin_email"],
            admin_password=kwargs["admin_password"],
            org_name=kwargs["org_name"],
            aoc_be_image=kwargs.get("aoc_be_image"),
            aoc_image=kwargs.get("aoc_image"),
            profile_manager_image=kwargs.get("profile_manager_image"),
            keycloak_image=kwargs.get("keycloak_image"),
            keycloak_smtp_username=kwargs["keycloak_smtp_username"],
            keycloak_smtp_password=kwargs["keycloak_smtp_password"],
            keycloak_smtp_host=kwargs["keycloak_smtp_host"],
            keycloak_smtp_from=kwargs["keycloak_smtp_from"],
            keycloak_smtp_port=kwargs["keycloak_smtp_port"],
            mkcerts=mkcerts,
            certs_dir=certs_dir,
        )
        
        # Save config to YAML file
        init_config.save_to_yaml()
        click.echo("Configuration saved to config file.")
        
        await execute_init(init_config, continue_from_config=continue_from_config)
        return

    # Original production/non-dev flow
    click.echo("Initializing AoC...\n")

    load_environment(env_file)

    configs, config_metadata = collect_configurations(
        interactive=kwargs["interactive"],
        env=kwargs["env"],
        domain=kwargs["domain"],
        protocol=kwargs["protocol"],
        admin_email=kwargs["admin_email"],
        admin_password=kwargs["admin_password"],
        org_name=kwargs["org_name"],
        keycloak_smtp_username=kwargs["keycloak_smtp_username"],
        keycloak_smtp_password=kwargs["keycloak_smtp_password"],
        keycloak_smtp_host=kwargs["keycloak_smtp_host"],
        keycloak_smtp_from=kwargs["keycloak_smtp_from"],
        keycloak_smtp_port=kwargs["keycloak_smtp_port"],
    )

    click.echo(f"env: {configs}")

    validate_configurations(configs, config_metadata)

    ctx.obj = configs  # Store configurations in context object for further usage
    ctx.obj["output_dir"] = output_dir
    ctx.obj["overwrite"] = overwrite

    init_config = InitConfig(
        env=Environment(configs.get("env")),
        aoc_dir=Path(output_dir),
        protocol=Protocol(configs.get("protocol")),
        domain=configs.get("domain"),
        admin_email=configs.get("admin_email"),
        admin_password=configs.get("admin_password"),
        org_name=configs.get("org_name"),
        aoc_be_image=kwargs.get("aoc_be_image"),
        aoc_image=kwargs.get("aoc_image"),
        profile_manager_image=kwargs.get("profile_manager_image"),
        keycloak_image=kwargs.get("keycloak_image"),
        keycloak_smtp_username=kwargs.get("keycloak_smtp_username"),
        keycloak_smtp_password=kwargs.get("keycloak_smtp_password"),
        keycloak_smtp_host=kwargs.get("keycloak_smtp_host"),
        keycloak_smtp_from=kwargs.get("keycloak_smtp_from"),
        keycloak_smtp_port=kwargs.get("keycloak_smtp_port"),
        mkcerts=mkcerts,
        certs_dir=certs_dir,
    )

    await execute_init(init_config)


async def execute_init(config: InitConfig, continue_from_config: bool = False) -> None:
    """Execute the initialization process."""
    # Check if 'aoc' workspace already exists
    result = subprocess.run(
        ["bitswan", "workspace", "list"], capture_output=True, text=True
    )

    subprocess.run(
            [
                "bitswan",
                "ingress",
                "init",
            ],
    )
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

    await ingress.add_proxy(
        f"aoc.{config.domain}",
        "aoc:3000",
    )
    await ingress.add_proxy(
        f"api.{config.domain}",
        (
            "aoc-bitswan-backend:5000"
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
    subprocess.run(
        ['docker', 'compose', 'up', '-d'],
        check=True,
        cwd=config.aoc_dir,
    )

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
        aoc_admin_info = f"""
    AOC Admin:
    Admin user: {config.admin_email}
    Admin password: {config.admin_password}"""

        if config.env == Environment.DEV:
            # Copy the generated local env file to nextjs directory
            project_root = Path(__file__).parent.parent.parent
            nextjs_env_path = project_root / "nextjs" / ".env.local"
            local_env_path = config.aoc_dir / "envs" / "operations-centre.env"
            
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

    Access the AOC at: http://localhost:3000{keycloak_info}{aoc_admin_info}
    """
        else:
            access_message = f"""
    Access the AOC at: {config.protocol.value}://aoc.{config.domain}{keycloak_info}{aoc_admin_info}
    """

        click.echo(access_message)
    except Exception as e:
        # Fallback to basic message if env file reading fails
        if config.env == Environment.DEV:
            access_message = f"""
    cd to the nextjs directory and run:
    pnpm dev

    Access the AOC at: http://localhost:3000
    """
        else:
            access_message = f"""
    Access the AOC at: {config.protocol.value}://aoc.{config.domain}
    """
        click.echo(access_message)
        click.echo(f"Note: Unable to print Keycloak admin info: {e}")


def create_aoc_directory(config: InitConfig) -> None:
    config.aoc_dir.mkdir(parents=True, exist_ok=True)


def resolve_images(config: InitConfig) -> None:
    """Ensure config image fields are full image references with tags.

    If a field is unset, query Docker Hub and pick the latest tag matching
    the expected pattern, then set the config field accordingly.
    """
    def latest_tag_from_docker_hub(url: str, pattern: str = r"\d{4}-\d+-git-[a-fA-F0-9]+$") -> str:
        try:
            resp = requests.get(url, timeout=15)
            if resp.status_code == 200:
                results = resp.json().get("results", [])
                for version in results:
                    name = version.get("name")
                    if name and re.match(pattern, name):
                        return name
        except Exception:
            pass
        return "latest"

    # bitswan-backend
    if not config.aoc_be_image:
        tag = latest_tag_from_docker_hub(
            "https://hub.docker.com/v2/repositories/bitswan/bitswan-backend/tags/"
        )
        config.aoc_be_image = f"bitswan/bitswan-backend:{tag}"

    # automation-operations-centre (AOC)
    if not config.aoc_image:
        tag = latest_tag_from_docker_hub(
            "https://hub.docker.com/v2/repositories/bitswan/automation-operations-centre/tags/"
        )
        config.aoc_image = f"bitswan/automation-operations-centre:{tag}"

    # profile-manager
    if not config.profile_manager_image:
        tag = latest_tag_from_docker_hub(
            "https://hub.docker.com/v2/repositories/bitswan/profile-manager/tags/"
        )
        config.profile_manager_image = f"bitswan/profile-manager:{tag}"

    # keycloak
    if not config.keycloak_image:
        tag = latest_tag_from_docker_hub(
            "https://hub.docker.com/v2/repositories/bitswan/bitswan-keycloak/tags/"
        )
        config.keycloak_image = f"bitswan/bitswan-keycloak:{tag}"


def replace_docker_compose_services_versions(config: InitConfig) -> None:
    click.echo("Finding latest versions for AOC services")

    # Read the docker-compose.yml file using yaml
    with open(config.aoc_dir / "docker-compose.yml", "r") as f:
        docker_compose = yaml.safe_load(f)

    # Images are expected to be resolved already in config
    service_to_image = {
        "bitswan-backend": config.aoc_be_image,
        "aoc": config.aoc_image,
        "profile-manager": config.profile_manager_image,
        "keycloak": config.keycloak_image,
    }

    for service_name, image in service_to_image.items():
        if image:
            docker_compose["services"][service_name]["image"] = image

    # Add dev mode configuration for bitswan-backend service
    if config.env == Environment.DEV:
        try:
            django_dir = _find_django_directory()
            click.echo(f"Adding dev mode volume mapping: {django_dir}:/app:z")
            
            # Ensure the bitswan-backend service exists
            if "bitswan-backend" not in docker_compose["services"]:
                docker_compose["services"]["bitswan-backend"] = {}
            
            # Add volume mapping for dev mode
            if "volumes" not in docker_compose["services"]["bitswan-backend"]:
                docker_compose["services"]["bitswan-backend"]["volumes"] = []
            
            # Add the django directory volume mapping
            volume_mapping = f"{django_dir}:/app:z"
            if volume_mapping not in docker_compose["services"]["bitswan-backend"]["volumes"]:
                docker_compose["services"]["bitswan-backend"]["volumes"].append(volume_mapping)
            
            # Ensure command is set to /start for dev mode
            docker_compose["services"]["bitswan-backend"]["command"] = "/start"
            
        except Exception as e:
            click.echo(f"Warning: Could not configure dev mode volumes: {e}")
            click.echo("Continuing without dev mode volume mapping...")

    # Write the updated docker-compose.yml file
    with open(config.aoc_dir / "docker-compose.yml", "w") as f:
        yaml.dump(docker_compose, f)


def setup_keycloak(config: InitConfig) -> None:
    # Use localhost for development to avoid DNS resolution issues with .localhost domains
    if config.env == Environment.DEV:
        server_url = "http://localhost:8080"
    else:
        server_url = f"https://keycloak.{config.domain}"
        
    keycloak_config = KeycloakConfig(
        admin_username=config.admin_email,
        admin_password=config.admin_password,
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
