import click

from aoc_cli.init import init
from aoc_cli.uninstall import uninstall
from aoc_cli.update import update


@click.group()
@click.version_option()
def cli() -> None:
    """The Automation Operations Center (AOC) CLI"""
    pass


cli.add_command(init)
cli.add_command(uninstall)
cli.add_command(update)
