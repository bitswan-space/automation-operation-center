import os
from pathlib import Path
from typing import Dict, Optional, Union, Tuple, List

import click

from aoc_cli.env.config import InitConfig, Environment

def get_env_path(aoc_dir, service_name):
    return aoc_dir / "envs" / f"{service_name.lower().replace(' ','-')}.env"

def bootstrap_service(
    service_name: str,
    init_config: InitConfig,
    env_vars: Dict[str, List[Union[str, Tuple[str, str]]]],
    env_config: Dict[str, str],
    custom_message: Optional[str] = None,
    verbose: bool = False,
) -> None:
    """
    Generic function to bootstrap environment variables for any service.

    Args:
        service_name: Name of the service (for display purposes)
        init_config: The InitConfig
        env_vars: Dictionary of environment variables grouped by sections
        custom_message: Optional custom message to display
    """
    click.echo("\n")
    click.echo(custom_message or f"Bootstrapping {service_name} Environment Variables")

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


def get_env_var(
    var_name: str,
    default: str | None = None,
    env: Environment = Environment.DEV,
    required_in_prod: bool = False,
) -> str | None:
    """
    Get an environment variable, optionally requiring it in production.

    Args:
        var_name: Name of the environment variable.
        default: Default value if the variable is not set.
        env: Configured App environment
        required_in_prod: If True, raise an error in production if var is not set.

    Returns:
        The value of the environment variable, or default if provided and applicable.

    Raises:
        RuntimeError: If required_in_prod is True and we're in production and the variable is not set.
    """
    value = os.getenv(var_name, default)
    is_prod = env == Environment.PROD

    if required_in_prod and is_prod and (value is None or str(value).strip() == ""):
        raise RuntimeError(
            f"Missing required environment variable '{var_name}' in production."
        )

    return value
