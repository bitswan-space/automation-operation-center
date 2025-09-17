from typing import Dict

from aoc_cli.env.config import InitConfig
from aoc_cli.env.utils import bootstrap_service

# Re-exported bootstrap entrypoints to preserve existing imports


def write_env_files(init_config: InitConfig, env_config: Dict[str, str] | None = None) -> None:
    """Bootstrap all service environment variables (aggregated).

    This preserves the public API previously imported as `aoc_cli.env.services.bootstrap_services`.
    """
    env_config = env_config or {}

    from . import (
        nextjs as nextjs_service,
        bitswan_backend as bitswan_backend_service,
        bitswan_backend_db as bitswan_backend_db_service,
        emqx as emqx_service,
        influxdb as influxdb_service,
        keycloak as keycloak_service,
        keycloak_db as keycloak_db_service,
        profile_manager as profile_manager_service,
    )

    nextjs_service.bootstrap_operations_centre(init_config, env_config)
    influxdb_service.bootstrap(init_config, env_config)
    keycloak_service.bootstrap(init_config, env_config)
    keycloak_db_service.bootstrap(init_config, env_config)
    bitswan_backend_service.bootstrap(init_config, env_config)
    bitswan_backend_db_service.bootstrap(init_config, env_config)
    emqx_service.bootstrap(init_config, env_config)
    profile_manager_service.bootstrap(init_config, env_config)

__all__ = [
    "write_env_files",
]


