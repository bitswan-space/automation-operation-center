import subprocess
from dataclasses import dataclass
from pathlib import Path


@dataclass
class UninstallCommandArgs:
    force: bool
    remove_data: bool
    aoc_dir: Path


class UninstallCommand:
    def __init__(self, args: UninstallCommandArgs):
        self.args = args

    def execute(self) -> None:
        aoc_dir = self.args.aoc_dir

        if not aoc_dir.exists():
            print(f"AOC is not installed at path {aoc_dir}")
            return

        # Confirm uninstall
        if not (self.args.force or self._confirm_uninstall()):
            print("Uninstall cancelled.")
            return

        # Check if user wants to remove volumes
        remove_volumes = self.args.remove_data or self._confirm_volume_removal()

        # Perform uninstallation
        self._stop_services(aoc_dir, remove_volumes)
        self._remove_containers(aoc_dir)
        self._remove_aoc_directory(aoc_dir)

        print("AOC uninstalled successfully!")

    def _confirm_uninstall(self) -> bool:
        response = input("Are you sure you want to uninstall AOC? (yes/no): ").lower()
        return response == "yes"

    def _confirm_volume_removal(self) -> bool:
        print(
            "To remove all data volumes, type 'delete data' (this action cannot be undone)"
        )
        response = input("Type 'delete data' or press Enter to keep volumes: ")
        return response == "delete data"

    def _stop_services(self, aoc_dir: Path, remove_volumes: bool) -> None:
        try:
            if remove_volumes:
                subprocess.run(
                    ["docker-compose", "down", "-v"], cwd=aoc_dir, check=True
                )
            else:
                subprocess.run(["docker-compose", "down"], cwd=aoc_dir, check=True)
        except subprocess.CalledProcessError as e:
            print(f"Warning: Failed to stop services: {e}")

    def _remove_containers(self, aoc_dir: Path) -> None:
        try:
            subprocess.run(["docker-compose", "rm"], cwd=aoc_dir, check=True)
        except subprocess.CalledProcessError as e:
            print(f"Warning: Failed to remove containers: {e}")

    def _remove_aoc_directory(self, aoc_dir: Path) -> None:
        try:
            # Attempt with sudo
            subprocess.run(["sudo", "rm", "-rf", str(aoc_dir)], check=True)
        except subprocess.CalledProcessError as e:
            print(f"Error: Failed to remove directory even with sudo: {e}")
            print("Please manually remove the ~/.aoc directory")


def add_subparser(subparsers):
    """Add the uninstall command to the main parser"""
    parser = subparsers.add_parser(
        "uninstall", help="Uninstall AOC and optionally remove all data"
    )
    parser.add_argument(
        "--force",
        action="store_true",
        help="Skip confirmation prompts",
    )
    parser.add_argument(
        "--remove-data",
        action="store_true",
        help="Remove all data as well",
    )
    parser.add_argument(
        "--aoc-dir",
        type=Path,
        default=Path.home() / ".aoc",
        help="AOC installation directory (default: %(default)s)",
    )
    parser.set_defaults(func=UninstallCommand().execute)
