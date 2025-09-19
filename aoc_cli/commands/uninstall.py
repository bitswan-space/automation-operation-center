import subprocess
from dataclasses import dataclass
from pathlib import Path

import click


@dataclass
class UninstallCommandArgs:
    force: bool = False
    remove_data: bool = False
    aoc_dir: Path = Path.home() / ".config" / "bitswan" / "aoc"


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

    execute_uninstall(args)


def execute_uninstall(args: UninstallCommandArgs) -> None:
    """Execute the uninstall process."""
    aoc_dir = args.aoc_dir

    if not aoc_dir.exists():
        print(f"AOC is not installed at path {aoc_dir}")
        return

    # Confirm uninstall
    if not (args.force or confirm_uninstall()):
        print("Uninstall cancelled.")
        return

    # Check if user wants to remove volumes
    remove_volumes = args.remove_data or confirm_volume_removal()

    # Perform uninstallation
    stop_services(aoc_dir, remove_volumes)
    remove_containers(aoc_dir)
    remove_aoc_directory(aoc_dir)

    print("AOC uninstalled successfully!")


def confirm_uninstall() -> bool:
    response = input("Are you sure you want to uninstall AOC? (yes/no): ").lower()
    return response == "yes"


def confirm_volume_removal() -> bool:
    print(
        "To remove all data volumes, type 'delete data' (this action cannot be undone)"
    )
    response = input("Type 'delete data' or press Enter to keep volumes: ")
    return response == "delete data"


def stop_services(aoc_dir: Path, remove_volumes: bool) -> None:
    try:
        if remove_volumes:
            subprocess.run(
                ["docker", "compose", "down", "-v"], cwd=aoc_dir, check=True
            )
        else:
            subprocess.run(["docker", "compose", "down"], cwd=aoc_dir, check=True)
    except subprocess.CalledProcessError as e:
        print(f"Warning: Failed to stop services: {e}")


def remove_containers(aoc_dir: Path) -> None:
    try:
        subprocess.run(["docker", "compose", "rm"], cwd=aoc_dir, check=True)
    except subprocess.CalledProcessError as e:
        print(f"Warning: Failed to remove containers: {e}")


def remove_aoc_directory(aoc_dir: Path) -> None:
    try:
        # Attempt with sudo
        subprocess.run(["sudo", "rm", "-rf", str(aoc_dir)], check=True)
    except subprocess.CalledProcessError as e:
        print(f"Error: Failed to remove directory even with sudo: {e}")
        print("Please manually remove the ~/.aoc directory")