from typing import Dict

from aoc_cli.env.config import InitConfig
from aoc_cli.env.utils import write_env_files_service


def default_env(config: InitConfig) -> Dict[str, str]:
    return {
        "KC_DB": "postgres",
        "DB_ADDR": "postgres",
        "KC_DB_URL_HOST": "aoc-keycloak-postgres",
        "KC_DB_URL_DATABASE": "postgres",
        "KC_DB_USERNAME": "postgres",
        "KC_DB_PORT": "5432",
    }


def write_env_files(init_config: InitConfig, env_config: Dict[str, str] | None = None) -> None:
    env_config = env_config or {}
    write_env_files_service(
        service_name="keycloak-postgres",
        init_config=init_config,
        env_config=env_config,
        env_vars={
            "Keycloak DB Service Configuration": [
                ("POSTGRES_USER", env_config.get("KC_DB_USERNAME")),
                ("POSTGRES_PASSWORD", env_config.get("KC_DB_PASSWORD")),
                ("POSTGRES_DB", env_config.get("KC_DB")),
                ("POSTGRES_HOST", env_config.get("KC_DB_URL_HOST")),
                ("POSTGRES_PORT", "5432"),
            ]
        },
    )


