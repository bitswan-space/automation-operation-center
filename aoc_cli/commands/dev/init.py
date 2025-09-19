import asyncio

import click

from aoc_cli.env.config import Environment, InitConfig, Protocol
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
        domain="bitswan.localhost",
        admin_email=admin_email,
        admin_password=admin_password,
        org_name=org_name,
        keycloak_smtp_username="",
        keycloak_smtp_password="",
        keycloak_smtp_port="1025",
        keycloak_smtp_host="mailpit",
        keycloak_smtp_from="auth@bitswan.localhost",
    )

    handler = InitCommand(init_config)
    await handler.execute()
