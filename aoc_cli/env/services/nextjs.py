from typing import Dict

from aoc_cli.env.config import Environment, InitConfig
from aoc_cli.env.utils import write_env_files_service


def _public_base_url(config: InitConfig) -> str:
    if config.env == Environment.DEV:
        return "http://localhost:3000"
    return f"{config.protocol.value}://aoc.{config.domain}"


def default_env(config: InitConfig) -> Dict[str, str]:
    return {
        "NEXTAUTH_URL": _public_base_url(config),
        "AUTH_URL": _public_base_url(config),
        "KEYCLOAK_POST_LOGOUT_REDIRECT_URI": _public_base_url(config),
        "BITSWAN_BACKEND_API_URL": "http://aoc-bitswan-backend:8000"
        if config.env == Environment.DEV
        else "http://aoc-bitswan-backend:5000",
        "NEXT_PUBLIC_BITSWAN_BACKEND_API_URL": "http://aoc-bitswan-backend:8000"
        if config.env == Environment.DEV
        else "http://aoc-bitswan-backend:5000",
        "SENTRY_DSN": "",
    }


def write_env_files_operations_centre(
    init_config: InitConfig, env_config: Dict[str, str] | None = None
) -> None:
    env_config = env_config or {}
    write_env_files_service(
        service_name="Operations Centre",
        init_config=init_config,
        env_config=env_config,
        env_vars={
            "NextAuth": [
                "AUTH_URL",
                "AUTH_SECRET",
            ],
            "InfluxDB": [
                "INFLUXDB_URL",
                "INFLUXDB_ORG",
                "INFLUXDB_BUCKET",
                "INFLUXDB_USERNAME",
                "INFLUXDB_TOKEN",
            ],
            "Bitswan Backend": [
                "NEXT_PUBLIC_BITSWAN_BACKEND_API_URL",
                "BITSWAN_BACKEND_API_URL",
            ],
            "EMQX": [
                ("EMQX_JWT_SECRET", env_config.get("EMQX_AUTHENTICATION__1__SECRET")),
                "EMQX_MQTT_URL",
            ],
            "Keycloak": [
                "KEYCLOAK_ISSUER",
                "KEYCLOAK_CLIENT_ID",
                "KEYCLOAK_REFRESH_URL",
                "KEYCLOAK_END_SESSION_URL",
                "KEYCLOAK_POST_LOGOUT_REDIRECT_URI",
            ],
            "Sentry": [
                "SENTRY_IGNORE_API_RESOLUTION_ERROR",
                "SENTRY_AUTH_TOKEN",
                "SENTRY_DSN",
            ],
        },
    )


