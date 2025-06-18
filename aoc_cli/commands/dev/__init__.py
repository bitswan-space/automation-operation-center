import click

from aoc_cli.commands.dev.init import init

@click.group()
def dev():
    """Dev commands"""
    pass


dev.add_command(init)
