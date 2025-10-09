import re
import subprocess
from pathlib import Path

import click
import requests
import yaml

from aoc_cli.env.config import Environment, InitConfig
from aoc_cli.utils.images import resolve_images, replace_docker_compose_services_versions


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

    subprocess.run(
        ["docker", "compose", "-f", "docker-compose.yml", "up", "-d"],
        cwd=init_config.aoc_dir,
        check=True,
    )
