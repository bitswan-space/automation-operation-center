import asyncio
from pathlib import Path

import click

from aoc_cli.aoc_config import (
    collect_configurations,
    load_environment,
    validate_configurations,
)
from aoc_cli.handlers.init import InitCommand
from aoc_cli.config import Environment, InitConfig, Protocol


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
    )

    handler = InitCommand(init_config)
    await handler.execute()
