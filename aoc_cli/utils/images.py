"""Image resolution utilities for AOC services."""

import re
from typing import Optional

import click
import requests
import yaml

from aoc_cli.env.config import InitConfig


def resolve_images_from_url(config: InitConfig, from_url: str) -> None:
    """Resolve images from a URL endpoint that returns version information."""
    try:
        response = requests.get(from_url, timeout=15)
        if response.status_code == 200:
            versions = response.json()

            if versions.get("aoc") and not config.aoc_image:
                config.aoc_image = f"bitswan/automation-operations-centre:{versions['aoc']}"
            if versions.get("bitswan-backend") and not config.aoc_be_image:
                config.aoc_be_image = f"bitswan/bitswan-backend:{versions['bitswan-backend']}"
            if versions.get("keycloak") and not config.keycloak_image:
                config.keycloak_image = f"bitswan/bitswan-keycloak:{versions['keycloak']}"
    except Exception as e:
        click.echo(f"Warning: Could not fetch versions from {from_url}: {e}")
        click.echo("Falling back to Docker Hub for image resolution...")


def latest_tag_from_docker_hub(url: str, pattern: str = r"\d{4}-\d+-git-[a-fA-F0-9]+$") -> str:
    """Get the latest tag from Docker Hub matching the given pattern."""
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


def resolve_images(config: InitConfig) -> None:
    """Ensure config image fields are full image references with tags.

    If a field is unset, query Docker Hub and pick the latest tag matching
    the expected pattern, then set the config field accordingly.
    """
    # If from_url is provided, try to resolve images from that URL first
    if config.from_url:
        resolve_images_from_url(config, config.from_url)
    
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

    # keycloak
    if not config.keycloak_image:
        tag = latest_tag_from_docker_hub(
            "https://hub.docker.com/v2/repositories/bitswan/bitswan-keycloak/tags/"
        )
        config.keycloak_image = f"bitswan/bitswan-keycloak:{tag}"


def _find_django_directory() -> str:
    """Find the django directory using absolute path from git repo root."""
    import subprocess
    from pathlib import Path
    
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
            
        return str(django_dir)
    except (subprocess.CalledProcessError, FileNotFoundError) as e:
        raise RuntimeError(f"Could not find django directory: {e}")


def replace_docker_compose_services_versions(config: InitConfig) -> None:
    """Update docker-compose.yml with resolved image versions and environment-specific configuration."""
    click.echo("Finding latest versions for AOC services")

    # Read the docker-compose.yml file using yaml
    with open(config.aoc_dir / "docker-compose.yml", "r") as f:
        docker_compose = yaml.safe_load(f)

    # Images are expected to be resolved already in config
    service_to_image = {
        "bitswan-backend": config.aoc_be_image,
        "aoc": config.aoc_image,
        "keycloak": config.keycloak_image,
    }

    for service_name, image in service_to_image.items():
        if image:
            docker_compose["services"][service_name]["image"] = image

    # Add dev mode configuration for bitswan-backend service
    if config.env.value == "dev":
        try:
            django_dir = _find_django_directory()
            click.echo(f"Adding dev mode volume mapping: {django_dir}:/app:rwz")
            
            # Ensure the bitswan-backend service exists
            if "bitswan-backend" not in docker_compose["services"]:
                docker_compose["services"]["bitswan-backend"] = {}
            
            # Add volume mapping for dev mode
            if "volumes" not in docker_compose["services"]["bitswan-backend"]:
                docker_compose["services"]["bitswan-backend"]["volumes"] = []
            
            # Add the django directory volume mapping
            volume_mapping = f"{django_dir}:/app:rwz"
            if volume_mapping not in docker_compose["services"]["bitswan-backend"]["volumes"]:
                docker_compose["services"]["bitswan-backend"]["volumes"].append(volume_mapping)
            
            # Ensure command is set to /dev-command for dev mode
            docker_compose["services"]["bitswan-backend"]["command"] = "/dev-command"
            
        except Exception as e:
            click.echo(f"Warning: Could not configure dev mode volumes: {e}")
            click.echo("Continuing without dev mode volume mapping...")

    # Write the updated docker-compose.yml file
    with open(config.aoc_dir / "docker-compose.yml", "w") as f:
        yaml.dump(docker_compose, f)
