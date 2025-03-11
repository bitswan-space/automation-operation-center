import asyncio

import click

from aoc_cli.config import Environment, InitConfig, Protocol
from aoc_cli.handlers.init import InitCommand


@click.command()
@click.option(
    "--admin-email",
    default="admin@example.com",
    help="Admin email",
    prompt=True,
)
@click.option(
    "--admin-password",
    default="admin",
    help="Admin password",
    prompt=True,
    hide_input=True,
)
@click.option(
    "--org-name",
    default="Example Org",
    help="Organization name",
    prompt=True,
)
def init(admin_email, admin_password, org_name) -> None:
    asyncio.run(_init_async(admin_email, admin_password, org_name))


async def _init_async(admin_email, admin_password, org_name) -> None:
    click.echo("\n\nInitializing AoC Dev environment...")

    init_config = InitConfig(
        env=Environment("dev"),
        protocol=Protocol("http"),
        domain="platform.local",
        admin_email=admin_email,
        admin_password=admin_password,
        org_name=org_name,
    )

    handler = InitCommand(init_config)
    await handler.execute()
