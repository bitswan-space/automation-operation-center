import click
import subprocess
from aoc_cli.env.config import Environment, InitConfig
from aoc_cli.handlers.init import InitCommand


@click.command()
def update():
    init_config = InitConfig(env=Environment.PROD)
    init_command = InitCommand(init_config)

    init_command.replace_docker_compose_services_versions()

    subprocess.run(
        ["docker", "compose", "docker-compose.yml", "-d"], 
        cwd=init_config.aoc_dir, check=True
    )
