from typing import Dict, Optional

from aoc_cli.env.config import Environment, InitConfig


def get_var_defaults(
    config: "InitConfig", custom_defaults: Optional[Dict[str, str]] = None
) -> Dict[str, str]:
    """
    Return merged default environment variables for all services.

    This aggregates per-service defaults from `aoc_cli.env.services.*`.
    """
    # Lazy imports to avoid circulars
    from aoc_cli.env.services import (
        aoc as aoc_service,
        bitswan_backend as bitswan_backend_service,
        bitswan_backend_db as bitswan_backend_db_service,
        emqx as emqx_service,
        influxdb as influxdb_service,
        keycloak as keycloak_service,
        keycloak_db as keycloak_db_service,
        profile_manager as profile_manager_service,
    )

    defaults: Dict[str, str] = {}

    # Merge per-service defaults
    defaults.update(influxdb_service.default_env(config))
    defaults.update(keycloak_service.default_env(config))
    defaults.update(keycloak_db_service.default_env(config))
    defaults.update(bitswan_backend_service.default_env(config))
    defaults.update(bitswan_backend_db_service.default_env(config))
    defaults.update(emqx_service.default_env(config))
    defaults.update(aoc_service.default_env(config))
    defaults.update(profile_manager_service.default_env(config))

    # Dev-local overrides tailored for running Next.js on host
    if config.env == Environment.DEV:
        backend_base = f"{config.protocol.value}://api.{config.domain}"
        defaults.update(
            {
                "NEXTAUTH_URL": "http://localhost:3000",
                "AUTH_URL": "http://localhost:3000",
                "KEYCLOAK_POST_LOGOUT_REDIRECT_URI": "http://localhost:3000",
                # Point host Next.js to ingress domain instead of container port
                "BITSWAN_BACKEND_API_URL": backend_base,
                "NEXT_PUBLIC_BITSWAN_BACKEND_API_URL": backend_base,
                "INFLUXDB_URL": "http://localhost:8086/",
                "EMQX_MQTT_URL": "ws://localhost:8083/mqtt",
                "KEYCLOAK_ISSUER": "http://localhost:8080/realms/master",
                "KEYCLOAK_REFRESH_URL": "http://localhost:8080/realms/master/protocol/openid-connect/token",
                "KEYCLOAK_END_SESSION_URL": "http://localhost:8080/realms/master/protocol/openid-connect/logout",
            }
        )

    if custom_defaults:
        defaults.update(custom_defaults)

    return defaults
