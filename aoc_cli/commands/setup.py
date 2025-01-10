from argparse import _SubParsersAction
from pathlib import Path
from typing import Dict

from aoc_cli.config.variables import PlatformConfig, get_var_defaults
from aoc_cli.config.services import Protocol, Services
from aoc_cli.utils.env import write_env_file
from aoc_cli.utils.secrets import generate_secret


def generate_secrets(vars: Dict[str, str]) -> Dict[str, str]:
    """Generate all required secrets"""
    secrets_map = {
        "KEYCLOAK_POSTGRES_PASSWORD": "KEYCLOAK_KC_DB_PASSWORD",
        "BITSWAN_POSTGRES_PASSWORD": None,
        "INFLUXDB_PASSWORD": "DOCKER_INFLUXDB_INIT_PASSWORD",
        "NEXTAUTH_SECRET": None,
        "KEYCLOAK_ADMIN_PASSWORD": None,
        "CCS_CONFIG_KEY": None,
        "EMQX_DASHBOARD__DEFAULT_PASSWORD": None,
        "DJANGO_SECRET_KEY": None,
        "AUTH_SECRET_KEY": None,
    }

    for key, linked_key in secrets_map.items():
        vars[key] = generate_secret()
        if linked_key:
            vars[linked_key] = vars[key]

    return vars


def setup_command(args) -> int:
    """Setup command implementation"""
    config = PlatformConfig(domain=args.domain, protocol=Protocol(args.protocol))

    if not Path(".env").exists():
        vars = get_var_defaults(config)
        vars = generate_secrets(vars)

        for service in [
            Services.INFLUXDB,
            Services.KEYCLOAK,
            Services.KEYCLOAK_DB,
            Services.BITSWAN_DB,
            Services.OPERATIONS_CENTRE,
            Services.EMQX,
            Services.BITSWAN_BACKEND,
        ]:
            if not args.dry:
                write_env_file(vars, service)

        print("\nAdditional manual configuration required:")
        print("1. Set KEYCLOAK_CLIENT_SECRET - Get from Keycloak admin console")
        print(
            "2. Set INFLUXDB_TOKEN - Generate from InfluxDB UI (Data -> Tokens -> Generate)"
        )

        if not args.dry:
            print("\nTo update your hosts file for local development:")
            print("sudo platform_cli update-hosts")

    return 0


def add_subparser(subparsers: _SubParsersAction) -> None:
    """Add the setup command to the main parser"""
    parser = subparsers.add_parser("setup", help="Setup environment configuration")
    parser.add_argument(
        "--domain",
        default="platform.local",
        help="Domain where the platform will be accessed (default: %(default))",
    )
    parser.add_argument(
        "--protocol",
        default="http",
        choices=["http", "https"],
        help="Protocol to use for platform access (default: %(default))",
    )
    parser.add_argument("--dry", action="store_true", help="Dry run")
    parser.set_defaults(func=setup_command)
