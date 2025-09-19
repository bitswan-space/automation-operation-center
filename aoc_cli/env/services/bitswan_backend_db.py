from typing import Dict

from aoc_cli.env.config import InitConfig
from aoc_cli.env.utils import write_env_files_service


def default_env(config: InitConfig) -> Dict[str, str]:
    return {
        "BITSWAN_BACKEND_POSTGRES_USER": "postgres",
        "BITSWAN_BACKEND_POSTGRES_DB": "bitswan_backend",
        "BITSWAN_BACKEND_POSTGRES_HOST": "aoc-bitswan-backend-postgres",
        "BITSWAN_BACKEND_POSTGRES_PORT": "5432",
    }


def write_env_files(init_config: InitConfig, env_config: Dict[str, str] | None = None) -> None:
    env_config = env_config or {}
    write_env_files_service(
        service_name="Bitswan Backend Postgres",
        init_config=init_config,
        env_config=env_config,
        env_vars={
            "BITSWAN_BACKEND_DB": [
                ("POSTGRES_HOST", env_config.get("BITSWAN_BACKEND_POSTGRES_HOST")),
                ("POSTGRES_PORT", env_config.get("BITSWAN_BACKEND_POSTGRES_PORT")),
                ("POSTGRES_USER", env_config.get("BITSWAN_BACKEND_POSTGRES_USER")),
                ("POSTGRES_PASSWORD", env_config.get("BITSWAN_BACKEND_POSTGRES_PASSWORD")),
                ("POSTGRES_DB", env_config.get("BITSWAN_BACKEND_POSTGRES_DB")),
            ]
        },
    )


