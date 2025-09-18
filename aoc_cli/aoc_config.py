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
AOC_ORG_NAME = "AOC_ORG_NAME"
KEYCLOAK_SMTP_USERNAME = "KEYCLOAK_SMTP_USERNAME"
KEYCLOAK_SMTP_PASSWORD = "KEYCLOAK_SMTP_PASSWORD"
KEYCLOAK_SMTP_HOST = "KEYCLOAK_SMTP_HOST"
KEYCLOAK_SMTP_FROM = "KEYCLOAK_SMTP_FROM"
KEYCLOAK_SMTP_PORT = "KEYCLOAK_SMTP_PORT"


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
    org_name: str,
    keycloak_smtp_username: str,
    keycloak_smtp_password: str,
    keycloak_smtp_host: str,
    keycloak_smtp_from: str,
    keycloak_smtp_port: str,
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
            "default": "prod",
            "type": click.Choice(["dev", "prod"]),
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
        "org_name": {
            "option": org_name,
            "env_var": AOC_ORG_NAME,
            "prompt_text": "Organization name",
            "hide_input": False,
            "default": "Example Organization",
        },
        "keycloak_smtp_username": {
            "option": keycloak_smtp_username,
            "env_var": KEYCLOAK_SMTP_USERNAME,
            "prompt_text": "Keycloak SMTP username",
            "hide_input": False,
            "default": "auth.no-reply@bitswan.localhost",
        },
        "keycloak_smtp_password": {
            "option": keycloak_smtp_password,
            "env_var": KEYCLOAK_SMTP_PASSWORD,
            "prompt_text": "Keycloak SMTP password",
            "hide_input": True,
        },
        "keycloak_smtp_host": {
            "option": keycloak_smtp_host,
            "env_var": KEYCLOAK_SMTP_HOST,
            "prompt_text": "Keycloak SMTP host",
            "hide_input": False,
        },
        "keycloak_smtp_from": {
            "option": keycloak_smtp_from,
            "env_var": KEYCLOAK_SMTP_FROM,
            "prompt_text": "Keycloak SMTP from",
            "hide_input": False,
        },
        "keycloak_smtp_port": {
            "option": keycloak_smtp_port,
            "env_var": KEYCLOAK_SMTP_PORT,
            "prompt_text": "Keycloak SMTP port",
            "hide_input": False,
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
    elif env_var in os.environ:
        return os.environ[env_var]
    elif interactive:
        return click.prompt(
            prompt_text, default=default, hide_input=hide_input, type=type
        )
    else:
        return default


def load_environment(env_file: str):
    """Loads environment variables from a given .env file."""
    if env_file:
        click.echo(f"Loading environment variables from {env_file}\n")
        load_dotenv(dotenv_path=env_file)
