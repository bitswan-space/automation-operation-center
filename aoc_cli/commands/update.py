import re
import subprocess
from pathlib import Path

import click
import requests
import yaml

from aoc_cli.env.config import Environment, InitConfig
from aoc_cli.env.utils import get_env_path
from aoc_cli.utils.env import get_env_map, write_env_file
from aoc_cli.utils.images import resolve_images, replace_docker_compose_services_versions

# Define mapping between config attributes and environment variable names
IMAGE_ENV_MAPPING = {
    'aoc_be_image': 'BITSWAN_BACKEND_IMAGE',
    'aoc_image': 'AOC_IMAGE', 
    'keycloak_image': 'KEYCLOAK_IMAGE',
}
IMAGE_ENV_VARS = list(IMAGE_ENV_MAPPING.values())


def update_image_env_vars(init_config: InitConfig) -> None:
    """Update only the image environment variables in bitswan-backend.env without prompting."""
    env_path = get_env_path(init_config.aoc_dir, "bitswan-backend")
    
    # Parse existing environment file using existing utility
    try:
        env_vars = get_env_map(env_path)
    except FileNotFoundError:
        env_vars = {}
    
    # Update image variables using the mapping
    for config_attr, env_var in IMAGE_ENV_MAPPING.items():
        value = getattr(init_config, config_attr) or ''
        env_vars[env_var] = value
    
    # Write updated environment file
    write_env_file_from_dict(env_vars, env_path)


def write_env_file_from_dict(env_vars: dict, env_path: Path) -> None:
    """Write environment variables from a dictionary to a file."""
    # Create simple key=value format
    lines = []
    for key, value in sorted(env_vars.items()):
        lines.append(f'{key}="{value}"')
    
    # Write to file using existing utility
    content = '\n'.join(lines)
    write_env_file(content, str(env_path))


@click.command()
@click.option("--from", "from_url", default=None, type=str, help="URL endpoint returning versions for update")
def update(from_url):
    aoc_image = None
    aoc_be_image = None
    keycloak_image = None
    saved_env = Environment.PROD  # Default to PROD if no saved config

    # Try to load from saved config to get environment and other settings
    try:
        saved_config = InitConfig.load_from_yaml()
        saved_env = saved_config.env
        from_url = from_url or saved_config.from_url  # Use provided from_url or saved one
        if saved_config.from_url and not from_url:
            click.echo(f"Using saved URL from config: {saved_config.from_url}")
        elif from_url:
            click.echo(f"Using provided URL: {from_url}")
    except FileNotFoundError:
        click.echo("No saved config found. Using default settings.")
        if not from_url:
            click.echo("No --from URL provided. Using Docker Hub for image resolution.")
    except Exception as e:
        click.echo(f"Warning: Could not load saved config: {e}")
        click.echo("Using default settings.")

    if from_url:
        response = requests.get(from_url)
        if response.status_code == 200:
            versions = response.json()

            if versions.get("aoc"):
                aoc_image = versions['aoc']
            if versions.get("bitswan-backend"):
                aoc_be_image = versions['bitswan-backend']
            if versions.get("keycloak"):
                keycloak_image = versions['keycloak']

    init_config = InitConfig(
        env=saved_env,
        aoc_image=aoc_image,
        aoc_be_image=aoc_be_image,
        keycloak_image=keycloak_image,
        from_url=from_url,
    )

    resolve_images(init_config)
    replace_docker_compose_services_versions(init_config)
    
    # Update environment variables with new image versions
    click.echo("Updating environment variables with new image versions...")
    update_image_env_vars(init_config)

    subprocess.run(
        ["docker", "compose", "-f", "docker-compose.yml", "up", "-d"],
        cwd=init_config.aoc_dir,
        check=True,
    )
