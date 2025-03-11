import os
from pathlib import Path
from typing import Dict, Optional

import click

from aoc_cli.config import Environment


def bootstrap_service(
    service_name: str,
    environment: Environment,
    env_vars: Dict[str, Dict[str, str]],
    env_file: Optional[str] = None,
    custom_message: Optional[str] = None,
    deployment_kind: str = "docker",
    project_name: str = None,
    verbose: bool = False,
) -> None:
    """
    Generic function to bootstrap environment variables for any service.

    Args:
        service_name: Name of the service (for display purposes)
        environment: Environment name (dev, prod, etc.)
        env_vars: Dictionary of environment variables grouped by sections
        env_file: Name of the environment file (defaults to service_name.env)
        custom_message: Optional custom message to display
    """
    click.echo("\n")
    click.echo(custom_message or f"Bootstrapping {service_name} Environment Variables")

    env_str = marshall_env(env_vars)

    # Use service_name for env file if not specified
    env_file = env_file or f"{service_name.lower()}.env"
    env_path = get_env_path(
        environment,
        env_file,
        deployment_kind,
        project_name,
    )

    click.echo(f"✓ Writing environment variables to {env_path}")

    if os.path.exists(env_path):
        override_dot_env = click.confirm(
            f"{env_file} already exists, do you want to override it?",
            default=False,
        )

        if override_dot_env:
            write_env_file(env_str, env_path)
        else:
            if verbose:
                # Display the env content without overriding
                click.echo(f"\n--- Environment Variables for {env_path} ---")
                click.echo(env_str)
                click.echo("-------------------------------------------")

    else:
        write_env_file(env_str, env_path)


def write_env_file(env_content: str, env_path: str) -> None:
    """
    Write environment variables to a file.
    Creates the directory path if it doesn't exist.
    """
    # Create directory if it doesn't exist
    directory = os.path.dirname(env_path)
    if directory and not os.path.exists(directory):
        os.makedirs(directory)
        click.echo(f"✓ Created directory {directory}")

    # Write the file
    with open(env_path, "w") as f:
        f.write(env_content)
    click.echo(f"✓ Wrote variables to {env_path}")


def get_env_path(
    environment: Environment,
    env_file: str | Path,
    deployment_kind: str = "docker",
    project_name: str = None,
) -> Path:
    """
    Get the path to the .env file for a given environment.

    Args:
        environment (str): The environment name (dev, prod, staging)

    Returns:
        Path: The path to the .env file for the given environment.
    """
    project_app_dir_mapping = {"aoc": Path(__file__).parent.parent.parent / "nextjs"}

    if environment == Environment.DEV and deployment_kind == "docker":
        return Path(__file__).parent.parent.parent / "deployment" / "envs" / env_file
    elif environment == Environment.DEV and deployment_kind == "local":
        return project_app_dir_mapping[project_name] / env_file

    # TODO: Read from generated config file the specified aoc_dir
    return


def marshall_env(env_dict):
    """
    Convert a nested dictionary of environment variables into a formatted .env string.

    Args:
        env_dict: A dictionary where each key is a comment/section name and each value
                 is a dictionary of environment variable key-value pairs.

    Returns:
        A formatted string suitable for writing to a .env file.
    """
    sections = []

    for comment, variables in env_dict.items():
        lines = [f"# {comment}"]

        for key, value in variables.items():
            lines.append(f'{key}="{value}"')

        sections.append("\n".join(lines))

    return "\n\n".join(sections)
