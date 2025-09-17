import re
import subprocess
from pathlib import Path

import click
import requests
import yaml

from aoc_cli.env.config import Environment, InitConfig


@click.command()
@click.option("--from", "from_url", default=None, type=str, help="URL endpoint returning versions for update")
def update(from_url):
    aoc_image = None
    aoc_be_image = None
    profile_manager_image = None
    keycloak_image = None

    if from_url:
        response = requests.get(from_url)
        if response.status_code == 200:
            versions = response.json()

            if versions.get("aoc"):
                aoc_image = f"bitswan/automation-operations-centre:{versions['aoc']}"
            if versions.get("bitswan-backend"):
                aoc_be_image = f"bitswan/bitswan-backend:{versions['bitswan-backend']}"
            if versions.get("profile-manager"):
                profile_manager_image = (
                    f"bitswan/profile-manager:{versions['profile-manager']}"
                )
            if versions.get("keycloak"):
                keycloak_image = f"bitswan/bitswan-keycloak:{versions['keycloak']}"

    init_config = InitConfig(
        env=Environment.PROD,
        aoc_image=aoc_image,
        aoc_be_image=aoc_be_image,
        profile_manager_image=profile_manager_image,
        keycloak_image=keycloak_image,
    )

    resolve_images(init_config)
    replace_docker_compose_services_versions(init_config)

    subprocess.run(
        ["docker", "compose", "-f", "docker-compose.yml", "up", "-d"],
        cwd=init_config.aoc_dir,
        check=True,
    )


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

    # Write the updated docker-compose.yml file
    with open(config.aoc_dir / "docker-compose.yml", "w") as f:
        yaml.dump(docker_compose, f)
