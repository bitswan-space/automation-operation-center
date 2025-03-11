import click

from aoc_cli.commands.dev import dev
from aoc_cli.init import init
from aoc_cli.uninstall import uninstall


@click.group()
@click.version_option()
def cli() -> None:
    """The Automation Operations Center (AOC) CLI"""
    pass


cli.add_command(init)
cli.add_command(uninstall)
cli.add_command(dev)
