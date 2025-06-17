import click

from aoc_cli.commands.dev.init import init
from aoc_cli.commands.dev.update import update


@click.group()
def dev():
    """Dev commands"""
    pass


dev.add_command(init)
dev.add_command(update)
