import click

from aoc_cli.commands.uninstall import UninstallCommand, UninstallCommandArgs


@click.command()
@click.option("--force", is_flag=True, help="Skip confirmation prompts")
@click.option("--remove-data", is_flag=True, help="Remove all data as well")
@click.option("--aoc-dir", type=click.Path(), help="AOC installation directory")
def uninstall(force, remove_data, aoc_dir):
    args = UninstallCommandArgs(force, remove_data, aoc_dir)

    UninstallCommand(args).execute()
