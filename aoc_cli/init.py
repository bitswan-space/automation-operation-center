import asyncio
from pathlib import Path

import click

from aoc_cli.aoc_config import (
    collect_configurations,
    load_environment,
    validate_configurations,
)
from aoc_cli.env.config import Environment, InitConfig, Protocol
from aoc_cli.handlers.init import InitCommand


@click.command()
@click.argument(
    "output_dir",
    required=False,
    default=Path.home() / ".config" / "bitswan" / "aoc",
    type=click.Path(exists=False, writable=True, file_okay=False, resolve_path=True),
)
@click.option("--overwrite", is_flag=True, help="Overwrite existing files")
@click.option("--env-file", type=click.Path(exists=True), help="Path to .env file")
@click.option("--interactive", is_flag=True, help="Enable interactive mode")
@click.option(
    "--env",
    type=click.Choice(["dev", "prod", "staging"]),
    help="Deployment environment",
)
@click.option("--domain", type=str, help="Domain")
@click.option("--protocol", type=click.Choice(["http", "https"]), help="Protocol")
@click.option("--admin-email", type=str, help="Admin email")
@click.option("--admin-password", type=str, hide_input=True, help="Admin password")
@click.option("--org-name", type=str, help="Organization name")
@click.option("--aoc-be-image", type=str, help="AOC BE docker image")
@click.option("--aoc-image", type=str, help="AOC FE docker image")
@click.option("--keycloak-smtp-username", type=str, help="Keycloak SMTP username")
@click.option("--keycloak-smtp-password", type=str, help="Keycloak SMTP password")
@click.option("--keycloak-smtp-host", type=str, help="Keycloak SMTP host")
@click.option("--keycloak-smtp-from", type=str, help="Keycloak SMTP from")
@click.option("--keycloak-smtp-port", type=str, help="Keycloak SMTP port")
@click.option(
    "--dev",
    is_flag=True,
    help="Use development environment defaults (sets env=dev, domain=bitswan.localhost, protocol=http, etc.)",
)
@click.option(
    "--continue",
    "continue_from_config",
    is_flag=True,
    help="Continue from existing config file without recreating environment files",
)
@click.pass_context
def init(
    ctx,
    output_dir: Path,
    env_file,
    overwrite,
    dev,
    continue_from_config,
    **kwargs,
):
    asyncio.run(_init_async(ctx, output_dir, env_file, overwrite, dev, continue_from_config, **kwargs))


async def _init_async(
    ctx,
    output_dir: Path,
    env_file,
    overwrite,
    dev,
    continue_from_config,
    **kwargs,
):
    """Initialize the Automation Operations Center (AOC)."""
    
    if dev:
        click.echo("\n\nInitializing AoC Dev environment...")
        
        if continue_from_config:
            try:
                init_config = InitConfig.load_from_yaml()
                click.echo("Loaded configuration from existing config file.")
                handler = InitCommand(init_config, continue_from_config=continue_from_config)
                await handler.execute()
                return
            except FileNotFoundError:
                click.echo("Error: No existing config file found. Run without --continue first.")
                return
        
        # Apply dev defaults when --dev flag is used
        dev_defaults = {
            "env": "dev",
            "domain": "bitswan.localhost", 
            "protocol": "http",
            "admin_email": kwargs.get("admin_email") or "admin@example.com",
            "admin_password": kwargs.get("admin_password") or "admin",
            "org_name": kwargs.get("org_name") or "Example Org",
            "keycloak_smtp_username": "",
            "keycloak_smtp_password": "",
            "keycloak_smtp_port": "1025",
            "keycloak_smtp_host": "mailpit",
            "keycloak_smtp_from": "auth@bitswan.localhost",
        }
        
        # Merge user-provided options with dev defaults, prioritizing user input
        for key, default_value in dev_defaults.items():
            if kwargs.get(key) is None:
                kwargs[key] = default_value
        
        init_config = InitConfig(
            env=Environment(kwargs["env"]),
            aoc_dir=Path(output_dir),
            protocol=Protocol(kwargs["protocol"]),
            domain=kwargs["domain"],
            admin_email=kwargs["admin_email"],
            admin_password=kwargs["admin_password"],
            org_name=kwargs["org_name"],
            aoc_be_image=kwargs.get("aoc_be_image"),
            aoc_image=kwargs.get("aoc_image"),
            profile_manager_image=kwargs.get("profile_manager_image"),
            keycloak_smtp_username=kwargs["keycloak_smtp_username"],
            keycloak_smtp_password=kwargs["keycloak_smtp_password"],
            keycloak_smtp_host=kwargs["keycloak_smtp_host"],
            keycloak_smtp_from=kwargs["keycloak_smtp_from"],
            keycloak_smtp_port=kwargs["keycloak_smtp_port"],
        )
        
        # Save config to YAML file
        init_config.save_to_yaml()
        click.echo("Configuration saved to config file.")
        
        handler = InitCommand(init_config, continue_from_config=continue_from_config)
        await handler.execute()
        return

    # Original production/non-dev flow
    click.echo("Initializing AoC...\n")

    load_environment(env_file)

    configs, config_metadata = collect_configurations(
        interactive=kwargs["interactive"],
        env=kwargs["env"],
        domain=kwargs["domain"],
        protocol=kwargs["protocol"],
        admin_email=kwargs["admin_email"],
        admin_password=kwargs["admin_password"],
        org_name=kwargs["org_name"],
        keycloak_smtp_username=kwargs["keycloak_smtp_username"],
        keycloak_smtp_password=kwargs["keycloak_smtp_password"],
        keycloak_smtp_host=kwargs["keycloak_smtp_host"],
        keycloak_smtp_from=kwargs["keycloak_smtp_from"],
        keycloak_smtp_port=kwargs["keycloak_smtp_port"],
    )

    click.echo(f"env: {configs}")

    validate_configurations(configs, config_metadata)

    ctx.obj = configs  # Store configurations in context object for further usage
    ctx.obj["output_dir"] = output_dir
    ctx.obj["overwrite"] = overwrite

    init_config = InitConfig(
        env=Environment(configs.get("env")),
        aoc_dir=Path(output_dir),
        protocol=Protocol(configs.get("protocol")),
        domain=configs.get("domain"),
        admin_email=configs.get("admin_email"),
        admin_password=configs.get("admin_password"),
        org_name=configs.get("org_name"),
        aoc_be_image=kwargs.get("aoc_be_image"),
        aoc_image=kwargs.get("aoc_image"),
        keycloak_smtp_username=kwargs.get("keycloak_smtp_username"),
        keycloak_smtp_password=kwargs.get("keycloak_smtp_password"),
        keycloak_smtp_host=kwargs.get("keycloak_smtp_host"),
        keycloak_smtp_from=kwargs.get("keycloak_smtp_from"),
        keycloak_smtp_port=kwargs.get("keycloak_smtp_port"),
    )

    handler = InitCommand(init_config)
    await handler.execute()
