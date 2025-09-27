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
    defaults.update(profile_manager_service.default_env(config))

    # Dev overrides for backend services only
    if config.env == Environment.DEV:
        defaults.update(
            {
                # Bitswan Backend dev overrides
                "DJANGO_SETTINGS_MODULE": "config.settings.local",
                "DJANGO_ALLOWED_HOSTS": f"api.{config.domain},aoc-bitswan-backend,aoc-frontend,localhost",
                "CORS_ALLOWED_ORIGINS": f"{config.protocol.value}://aoc.{config.domain},http://localhost:3000",
                "EMQX_EXTERNAL_URL": "aoc-emqx:8084",
                
                # Keycloak dev overrides
                "KC_HOSTNAME_URL": "http://localhost:8080",
                "KC_HOSTNAME": "http://localhost:8080",
                "KC_HOSTNAME_ADMIN_URL": "http://localhost:8080",
                "KC_HOSTNAME_ADMIN": "http://localhost:8080",
                "KEYCLOAK_FRONTEND_URL": "http://localhost:8080",
                "KEYCLOAK_ADMIN_URL": "http://localhost:8080",
                
                # Service URLs for dev
                "INFLUXDB_URL": "http://localhost:8086/",
                "EMQX_MQTT_URL": f"ws://mqtt.{config.domain}/mqtt",
                "KEYCLOAK_ISSUER": "http://localhost:8080/realms/master",
                "KEYCLOAK_REFRESH_URL": "http://localhost:8080/realms/master/protocol/openid-connect/token",
                "KEYCLOAK_END_SESSION_URL": "http://localhost:8080/realms/master/protocol/openid-connect/logout",
            }
        )

    if custom_defaults:
        defaults.update(custom_defaults)

    return defaults
