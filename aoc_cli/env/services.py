import click

from aoc_cli.env.config import (
    OPERATIONS_CENTRE_DOCKER_ENV_FILE,
    Environment,
    InitConfig,
)
from aoc_cli.env.utils import bootstrap_service


def bootstrap_influx_db(
    init_config: InitConfig, env_config: dict[str, str] = None
) -> None:
    """Bootstrap InfluxDB environment variables."""

    env_config = env_config or {}

    bootstrap_service(
        service_name="InfluxDB",
        init_config=init_config,
        env_config=env_config,
        env_vars={
            "Influxdb Service Configuration": [
                "DOCKER_INFLUXDB_INIT_ORG",
                "DOCKER_INFLUXDB_INIT_BUCKET",
                "DOCKER_INFLUXDB_INIT_USERNAME",
                "DOCKER_INFLUXDB_INIT_PASSWORD",
            ]
        },
    )


def bootstrap_keycloak(
    init_config: InitConfig, env_config: dict[str, str] = None
) -> None:
    """Bootstrap Keycloak environment variables."""
    env_config = env_config or {}

    bootstrap_service(
        service_name="Keycloak",
        init_config=init_config,
        env_config=env_config,
        env_vars={
            "Keycloak Service Configuration": [
                "KC_HOSTNAME_URL",
                "KC_HOSTNAME",
                "KC_HOSTNAME_ADMIN",
                "KC_HOSTNAME_ADMIN_URL",
                "KC_HTTP_ENABLED",
                "KC_BOOTSTRAP_ADMIN_PASSWORD",
                "KEYCLOAK_ADMIN",
                "PROXY_ADDRESS_FORWARDING",
                "KC_PROXY",
                "KC_DB",
                "DB_ADDR",
                "KC_DB_URL_HOST",
                "KC_DB_URL_DATABASE",
                "KC_DB_USERNAME",
                "KC_DB_PASSWORD",
                "KC_PROXY_HEADERS",
                "KC_HOSTNAME_STRICT",
                "KC_HOSTNAME_STRICT_HTTPS",
                "KC_HEALTH_ENABLED",
                "KC_FEATURES",
            ]
        },
    )


def bootstrap_keycloak_db(
    init_config: InitConfig, env_config: dict[str, str] = None
) -> None:
    """Bootstrap Keycloak DB environment variables."""
    env_config = env_config or {}

    bootstrap_service(
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


def bootstrap_bitswan_backend(
    init_config: InitConfig, env_config: dict[str, str] = None
) -> None:
    """Bootstrap Bitswan Backend environment variables."""
    env_config = env_config or {}
    
    POSTGRES_USER = env_config.get("BITSWAN_BACKEND_POSTGRES_USER")
    POSTGRES_HOST = env_config.get("BITSWAN_BACKEND_POSTGRES_HOST")
    POSTGRES_PORT = env_config.get("BITSWAN_BACKEND_POSTGRES_PORT")
    POSTGRES_USER = env_config.get("BITSWAN_BACKEND_POSTGRES_USER")
    POSTGRES_PASSWORD = env_config.get("BITSWAN_BACKEND_POSTGRES_PASSWORD")
    POSTGRES_DB = env_config.get("BITSWAN_BACKEND_POSTGRES_DB")

    DATABASE_URL = f"postgres://{POSTGRES_USER}:{POSTGRES_PASSWORD}@{POSTGRES_HOST}:{POSTGRES_PORT}/{POSTGRES_DB}"

    bootstrap_service(
        service_name="Bitswan Backend",
        init_config=init_config,
        env_config=env_config,
        env_vars={
            "Bitswan Backend Service Configuration": [
                "DJANGO_SECRET_KEY",
                "DJANGO_ADMIN_URL",
                "DJANGO_ALLOWED_HOSTS",
                "DJANGO_SECURE_SSL_REDIRECT",
                "DJANGO_SERVER_EMAIL",
                "DJANGO_ACCOUNT_ALLOW_REGISTRATION",
                "WEB_CONCURRENCY",
                "SENTRY_DSN",
                "SENTRY_TRACES_SAMPLE_RATE",
                "REDIS_URL",
                "KEYCLOAK_SERVER_URL",
                "KEYCLOAK_CLIENT_ID",
                "KEYCLOAK_REALM_NAME",
                "AUTH_SECRET_KEY",
                "CORS_ALLOWED_ORIGINS",
                "USE_DOCKER",
                "DJANGO_READ_DOT_ENV_FILE",
                "EMQX_EXTERNAL_URL",
                "EMQX_INTERNAL_URL",
                ("EMQX_JWT_SECRET", env_config.get("EMQX_AUTHENTICATION__1__SECRET")),
                ("DATABASE_URL", DATABASE_URL),
            ]
        },
    )


def bootsrap_bitswan_backend_db(
    init_config: InitConfig, env_config: dict[str, str] = None
) -> None:
    """Bootstrap Bitswan Backend DB environment variables."""
    env_config = env_config or {}

    bootstrap_service(
        service_name="Bitswan Backend Postgres",
        init_config=init_config,
        env_config=env_config,
        env_vars={
            "BITSWAN_BACKEND_DB": [
                ("POSTGRES_HOST", env_config.get("BITSWAN_BACKEND_POSTGRES_HOST")),
                ("POSTGRES_PORT", env_config.get("BITSWAN_BACKEND_POSTGRES_PORT")),
                ("POSTGRES_USER", env_config.get("BITSWAN_BACKEND_POSTGRES_USER")),
                (
                    "POSTGRES_PASSWORD",
                    env_config.get("BITSWAN_BACKEND_POSTGRES_PASSWORD"),
                ),
                ("POSTGRES_DB", env_config.get("BITSWAN_BACKEND_POSTGRES_DB")),
            ]
        },
    )


def bootstrap_operations_centre(
    init_config: InitConfig, env_config: dict[str, str] = None
) -> None:
    """Bootstrap Operations Centre environment variables."""
    env_config = env_config or {}

    bootstrap_service(
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


def bootstrap_emqx(init_config: InitConfig, env_config: dict[str, str] = None) -> None:
    """Bootstrap EMQX environment variables."""
    env_config = env_config or {}

    bootstrap_service(
        service_name="EMQX",
        init_config=init_config,
        env_config=env_config,
        env_vars={
            "EMQX": [
                "EMQX_HOST",
                "EMQX_PORT",
                "EMQX_USER",
                "EMQX_DASHBOARD__DEFAULT_PASSWORD",
            ],
            "JWT Authentication": [
                "EMQX_AUTHENTICATION__1__SECRET",
                "EMQX_AUTHENTICATION__1__MECHANISM",
                "EMQX_AUTHENTICATION__1__FROM",
                "EMQX_AUTHENTICATION__1__USE_JWKS",
                "EMQX_AUTHENTICATION__1__ALGORITHM",
            ],
        },
    )


def bootstrap_profile_manager(
    init_config: InitConfig, env_config: dict[str, str] = None
) -> None:
    """Bootstrap Profile Manager environment variables."""
    env_config = env_config or {}

    bootstrap_service(
        service_name="Profile Manager",
        init_config=init_config,
        env_config=env_config,
        env_vars={
            "Profile Manager": [
                ("MQTT_BROKER_URL", "mqtt://aoc-emqx:1883"),
                (
                    "MQTT_BROKER_SECRET",
                    env_config.get("EMQX_AUTHENTICATION__1__SECRET"),
                ),
            ]
        },
    )


def bootstrap_services(
    init_config: InitConfig, env_config: dict[str, str] = None
) -> None:
    """Bootstrap all services environment variables."""
    env_config = env_config or {}
    click.echo("\nBootstrapping Services Environment Variables")

    bootstrap_operations_centre(init_config, env_config)
    bootstrap_influx_db(init_config, env_config)
    bootstrap_keycloak(init_config, env_config)
    bootstrap_keycloak_db(init_config, env_config)
    bootstrap_bitswan_backend(init_config, env_config)
    bootsrap_bitswan_backend_db(init_config, env_config)
    bootstrap_emqx(init_config, env_config)
    bootstrap_profile_manager(init_config, env_config)
