from pathlib import Path

from aoc_cli.config import Environment


def get_aoc_working_directory(env: Environment, aoc_dir: Path) -> Path:
    """Get the working directory for the given environment"""
    if env == Environment.DEV:
        return Path(__file__).parent.parent.parent / "deployment"

    return aoc_dir
