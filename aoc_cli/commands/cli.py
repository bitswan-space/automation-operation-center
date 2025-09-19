import click

from aoc_cli.commands.init import init
from aoc_cli.commands.uninstall import uninstall
from aoc_cli.commands.update import update
from aoc_cli.commands.hosts import update_hosts


@click.group()
@click.version_option()
def cli() -> None:
    """The Automation Operations Center (AOC) CLI"""
    pass


cli.add_command(init)
cli.add_command(uninstall)
cli.add_command(update)
cli.add_command(update_hosts)
