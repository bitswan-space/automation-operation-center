import os
import typing as t
from dataclasses import dataclass
from typing import Dict

import click
from dotenv import load_dotenv

AOC_SETUP_ENVIRONMENT = "AOC_SETUP_ENVIRONMENT"
AOC_DOMAIN = "AOC_DOMAIN"
AOC_PROTOCOL = "AOC_PROTOCOL"
AOC_ADMIN_EMAIL = "AOC_ADMIN_EMAIL"
AOC_ADMIN_PASSWORD = "AOC_ADMIN_PASSWORD"
AOC_ORG_NAME = "AOC_ORG_NAME"


@dataclass
class AoCEnvar:
    name: str
    message: str
    status: str
    fix: str
    value: str


def verify_mandatory_envars() -> Dict[str, AoCEnvar]:
    """Check if all needed envars are set"""
    envars = {}

    # Check if all envars are set
    for envar in [
        AOC_SETUP_ENVIRONMENT,
        AOC_DOMAIN,
        AOC_PROTOCOL,
        AOC_ADMIN_EMAIL,
        AOC_ADMIN_PASSWORD,
        AOC_ORG_NAME,
    ]:
        if not os.environ.get(envar):
            envars[envar] = AoCEnvar(
                name=envar,
                message=f"Environment variable {envar} is not set",
                status="error",
                fix="Set the environment variable and try again",
                value="",
            )

        else:
            envars[envar] = AoCEnvar(
                name=envar,
                message=f"Environment variable {envar} is set",
                status="success",
                fix="",
                value=os.environ.get(envar),
            )

    return envars


def collect_configurations(
    interactive: bool,
    env: str,
    domain: str,
    protocol: str,
    admin_email: str,
    admin_password: str,
    org_name: str,
):
    """
    Retrieves configuration values using CLI options, env variables, or interactive input.
    Returns:
        - `configs`: A dictionary of resolved values.
        - `config_map`: The original config metadata for validation purposes.
    """

    config_map = {
        "env": {
            "option": env,
            "env_var": AOC_SETUP_ENVIRONMENT,
            "prompt_text": "Environment",
            "hide_input": False,
            "default": "dev",
            "type": click.Choice(["dev", "prod", "staging"]),
        },
        "domain": {
            "option": domain,
            "env_var": AOC_DOMAIN,
            "prompt_text": "Domain",
            "hide_input": False,
            "default": "localhost",
        },
        "protocol": {
            "option": protocol,
            "env_var": AOC_PROTOCOL,
            "prompt_text": "Protocol",
            "hide_input": False,
            "default": "http",
            "type": click.Choice(["http", "https"]),
        },
        "admin_email": {
            "option": admin_email,
            "env_var": AOC_ADMIN_EMAIL,
            "prompt_text": "Admin email",
            "hide_input": False,
            "default": "admin@example.com",
        },
        "admin_password": {
            "option": admin_password,
            "env_var": AOC_ADMIN_PASSWORD,
            "prompt_text": "Admin password",
            "hide_input": True,  # Mask user input for passwords
        },
        "org_name": {
            "option": org_name,
            "env_var": AOC_ORG_NAME,
            "prompt_text": "Organization name",
            "hide_input": False,
            "default": "Example Organization",
        },
    }

    # Loop through config_map to retrieve each config using get_config_value
    configs = {}
    for key, config_info in config_map.items():
        configs[key] = get_config_value(
            option=config_info.get("option"),
            env_var=config_info.get("env_var"),
            prompt_text=config_info.get("prompt_text"),
            hide_input=config_info.get("hide_input", False),
            default=config_info.get("default"),
            type=config_info.get("type"),
            interactive=interactive,
        )
    return configs, config_map


def validate_configurations(configs: dict, config_map: dict):
    """
    Ensure all required configurations are present and non-empty.
    """
    missing_details = []

    for key, value in configs.items():
        if not value:
            config_info = config_map[key]

            missing_details.append(
                f"`{config_info['env_var']}` (environment variable) or --{key.replace('_', '-')} (CLI option)"
            )

    if missing_details:
        click.echo(
            "Error: Missing required configurations:\n"
            + "\n".join(f"  - {detail}" for detail in missing_details)
        )
        raise click.Abort()


def get_config_value(
    option: str,
    env_var: str,
    prompt_text: str,
    default: t.Optional[any] = None,
    type: t.Optional[t.Union[click.ParamType, t.Any]] = None,
    hide_input: bool = False,
    interactive: bool = True,
):
    """
    Get a configuration value by checking:
    1. If it was provided as a CLI option.
    2. If it exists in the environment variables.
    3. If interactive mode is enabled, prompt the user.
    """
    if option:
        return option
    if env_var in os.environ:
        return os.environ[env_var]
    if interactive:
        return click.prompt(
            prompt_text, default=default, hide_input=hide_input, type=type
        )
    return None  # Return None if not found and interactive mode is off


def load_environment(env_file: str):
    """Loads environment variables from a given .env file."""
    if env_file:
        click.echo(f"Loading environment variables from {env_file}\n")
        load_dotenv(dotenv_path=env_file)
