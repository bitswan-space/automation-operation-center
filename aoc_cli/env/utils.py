import os
from pathlib import Path
from typing import Dict, Optional, Union, Tuple, List

import click

from aoc_cli.env.config import InitConfig, Environment
from aoc_cli.utils.env import write_env_file, get_env_var


def get_env_path(aoc_dir, service_name):
    return aoc_dir / "envs" / f"{service_name.lower().replace(' ','-')}.env"

def write_env_files_service(
    service_name: str,
    init_config: InitConfig,
    env_vars: Dict[str, List[Union[str, Tuple[str, str]]]],
    env_config: Dict[str, str],
    custom_message: Optional[str] = None,
    verbose: bool = False,
) -> None:
    """
    Generic function to write environment files for any service.

    Args:
        service_name: Name of the service (for display purposes)
        init_config: The InitConfig
        env_vars: Dictionary of environment variables grouped by sections
        custom_message: Optional custom message to display
    """
    click.echo("\n")
    click.echo(custom_message or f"Writing {service_name} Environment Files")

    env_str = marshall_env(env_vars, env_config)

    # Use service_name for env file if not specified
    env_path = get_env_path(init_config.aoc_dir, service_name)
    click.echo(f"✓ Writing environment variables to {env_path}")

    if os.path.exists(env_path):
        override_dot_env = click.confirm(
            f"{env_path} already exists, do you want to override it?",
            default=False,
        )

        if override_dot_env:
            write_env_file(env_str, str(env_path))
            click.echo(f"✓ Wrote variables to {env_path}")
        else:
            if verbose:
                # Display the env content without overriding
                click.echo(f"\n--- Environment Variables for {env_path} ---")
                click.echo(env_str)
                click.echo("-------------------------------------------")

    else:
        write_env_file(env_str, str(env_path))
        click.echo(f"✓ Wrote variables to {env_path}")


def marshall_env(env_dict, env_config):
    """
    Convert a nested dictionary of environment variables into a formatted .env string.

    Returns:
        A formatted string suitable for writing to a .env file.
    """
    sections = []

    for comment, variables in env_dict.items():
        lines = [f"# {comment}"]

        for var in variables:
            if type(var) is str:
                key = var
                value = env_config.get(key)
            else:
                key, value = var
            # Avoid writing literal "None"; default to empty string when missing
            value = "" if (value is None or (isinstance(value, str) and value.strip().lower() == "none")) else value
            lines.append(f'{key}="{value}"')

        sections.append("\n".join(lines))

    return "\n\n".join(sections)
