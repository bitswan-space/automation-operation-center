import subprocess
import click
import yaml
from pathlib import Path

path = Path("~/.config/bitswan/aoc/docker-compose.yml").expanduser()


def change_version(docker_compose, service):
    image = docker_compose["services"][service]["image"].split(":")
    image[-1] = "XXX" # TODO: change to actuall version
    docker_compose["services"][service]["image"] = ":".join(image)


@click.command()
def update():
    with path.open('r') as f:
        docker_compose = yaml.safe_load(f)

    change_version(docker_compose, "aoc")
    change_version(docker_compose, "profile-manager")
    change_version(docker_compose, "bitswan-backend")

    with path.open('w') as f:
        yaml.dump(docker_compose, f)

    # subprocess.run(
    #     ["docker", "compose", "docker-compose.yml", "-d"], 
    #     cwd=Path.home() / ".config" / "bitswan" / "aoc", check=True
    # )

if __name__ == '__main__':
    update()
