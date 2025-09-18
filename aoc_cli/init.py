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
@click.pass_context
def init(
    ctx,
    output_dir: Path,
    env_file,
    overwrite,
    **kwargs,
):
    asyncio.run(_init_async(ctx, output_dir, env_file, overwrite, **kwargs))


async def _init_async(
    ctx,
    output_dir: Path,
    env_file,
    overwrite,
    **kwargs,
):
    """Initialize the Automation Operations Center (AOC)."""
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
