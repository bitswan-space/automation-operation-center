import click
import subprocess
from aoc_cli.env.config import Environment, InitConfig
from aoc_cli.handlers.init import InitCommand
import requests

@click.command()
@click.option("--from", "from_url", default=None, type=str, help="URL endpoint returning versions for update")
def update(from_url):
    click.echo(from_url)
    aoc_image=None
    aoc_be_image=None
    profile_manager_image=None

    if from_url:
        response = requests.get(from_url)
        if response.status_code == 200:
            versions = response.json()
            aoc_image = f"bitswan/automation-operations-centre:{versions["aoc"]}"
            aoc_be_image = f"bitswan/bitswan-backend:{versions["bitswan-backend"]}"
            profile_manager_image = f"bitswan/profile-manager:{versions["profile-manager"]}"

    init_config = InitConfig(
        env=Environment.PROD, 
        aoc_image=aoc_image, 
        aoc_be_image=aoc_be_image, 
        profile_manager_image=profile_manager_image
    )
    init_command = InitCommand(init_config)

    init_command.replace_docker_compose_services_versions()

    subprocess.run(
        ["docker", "compose", "-f", "docker-compose.yml", "up", "-d"],
        cwd=init_config.aoc_dir, check=True
    )
