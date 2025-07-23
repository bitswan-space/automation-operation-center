import click

from aoc_cli.handlers.uninstall import UninstallCommand, UninstallCommandArgs


@click.command()
@click.option("--force", is_flag=True, help="Skip confirmation prompts")
@click.option("--remove-data", is_flag=True, help="Remove all data as well")
@click.option("--aoc-dir", type=click.Path(), help="AOC installation directory")
def uninstall(force, remove_data, aoc_dir):
    # Only pass aoc_dir if it's provided, otherwise use the default from the dataclass
    if aoc_dir is not None:
        args = UninstallCommandArgs(force, remove_data, aoc_dir)
    else:
        args = UninstallCommandArgs(force, remove_data)

    UninstallCommand(args).execute()
