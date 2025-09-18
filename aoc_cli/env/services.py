import click

from aoc_cli.env.config import (
    OPERATIONS_CENTRE_DOCKER_ENV_FILE,
    DevSetupKind,
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
        environment=init_config.env,
        env_vars={
            "Influxdb Service Configuration": {
                "DOCKER_INFLUXDB_INIT_ORG": env_config.get("DOCKER_INFLUXDB_INIT_ORG"),
                "DOCKER_INFLUXDB_INIT_BUCKET": env_config.get(
                    "DOCKER_INFLUXDB_INIT_BUCKET"
                ),
                "DOCKER_INFLUXDB_INIT_USERNAME": env_config.get(
                    "DOCKER_INFLUXDB_INIT_USERNAME"
                ),
                "DOCKER_INFLUXDB_INIT_PASSWORD": env_config.get(
                    "DOCKER_INFLUXDB_INIT_PASSWORD"
                ),
            }
        },
        aoc_dir=init_config.aoc_dir,
    )


def bootstrap_keycloak(
    init_config: InitConfig, env_config: dict[str, str] = None
) -> None:
    """Bootstrap Keycloak environment variables."""
    env_config = env_config or {}

    bootstrap_service(
        service_name="Keycloak",
        environment=init_config.env,
        env_vars={
            "Keycloak Service Configuration": {
                "KC_HOSTNAME_URL": env_config.get("KC_HOSTNAME_URL"),
                "KC_HOSTNAME": env_config.get("KC_HOSTNAME"),
                "KC_HOSTNAME_ADMIN": env_config.get("KC_HOSTNAME_ADMIN"),
                "KC_HOSTNAME_ADMIN_URL": env_config.get("KC_HOSTNAME_ADMIN_URL"),
                "KC_HTTP_ENABLED": env_config.get("KC_HTTP_ENABLED"),
                "KEYCLOAK_ADMIN_PASSWORD": env_config.get("KEYCLOAK_ADMIN_PASSWORD"),
                "KEYCLOAK_ADMIN": env_config.get("KEYCLOAK_ADMIN"),
                "KC_HOSTNAME_URL": env_config.get("KC_HOSTNAME_URL"),
                "PROXY_ADDRESS_FORWARDING": env_config.get("PROXY_ADDRESS_FORWARDING"),
                "KC_PROXY": env_config.get("KC_PROXY"),
                "KC_DB": env_config.get("KC_DB"),
                "DB_ADDR": env_config.get("DB_ADDR"),
                "KC_DB_URL_HOST": env_config.get("KC_DB_URL_HOST"),
                "KC_DB_URL_DATABASE": env_config.get("KC_DB_URL_DATABASE"),
                "KC_DB_USERNAME": env_config.get("KC_DB_USERNAME"),
                "KC_DB_PASSWORD": env_config.get("KC_DB_PASSWORD"),
                "KC_PROXY_HEADERS": env_config.get("KC_PROXY_HEADERS"),
                "KC_HOSTNAME_STRICT": env_config.get("KC_HOSTNAME_STRICT"),
                "KC_HOSTNAME_STRICT_HTTPS": env_config.get("KC_HOSTNAME_STRICT_HTTPS"),
                "KC_HEALTH_ENABLED": env_config.get("KC_HEALTH_ENABLED"),
                "KC_FEATURES": env_config.get("KC_FEATURES"),
                "KC_HTTP_ENABLED": env_config.get("KC_HTTP_ENABLED"),
                "KC_HOSTNAME_STRICT_HTTPS": env_config.get("KC_HOSTNAME_STRICT_HTTPS"),
            }
        },
        aoc_dir=init_config.aoc_dir,
    )


def bootstrap_keycloak_db(
    init_config: InitConfig, env_config: dict[str, str] = None
) -> None:
    """Bootstrap Keycloak DB environment variables."""
    env_config = env_config or {}

    bootstrap_service(
        service_name="Keycloak DB",
        environment=init_config.env,
        env_vars={
            "Keycloak DB Service Configuration": {
                "POSTGRES_USER": env_config.get("KC_DB_USERNAME"),
                "POSTGRES_PASSWORD": env_config.get("KC_DB_PASSWORD"),
                "POSTGRES_DB": env_config.get("KC_DB"),
                "POSTGRES_HOST": env_config.get("KC_DB_URL_HOST"),
                "POSTGRES_PORT": env_config.get("KC_DB_PORT"),
            }
        },
        env_file="keycloak-postgres.env",
        aoc_dir=init_config.aoc_dir,
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

    env_vars = {
        "Bitswan Backend Service Configuration": {
            "DJANGO_SECRET_KEY": env_config.get("DJANGO_SECRET_KEY"),
            "DJANGO_ADMIN_URL": env_config.get("DJANGO_ADMIN_URL"),
            "DJANGO_ALLOWED_HOSTS": env_config.get("DJANGO_ALLOWED_HOSTS"),
            "DJANGO_SECURE_SSL_REDIRECT": env_config.get("DJANGO_SECURE_SSL_REDIRECT"),
            "DJANGO_SERVER_EMAIL": env_config.get("DJANGO_SERVER_EMAIL"),
            "DJANGO_ACCOUNT_ALLOW_REGISTRATION": env_config.get(
                "DJANGO_ACCOUNT_ALLOW_REGISTRATION"
            ),
            "WEB_CONCURRENCY": env_config.get("WEB_CONCURRENCY"),
            "SENTRY_DSN": env_config.get("SENTRY_DSN"),
            "SENTRY_TRACES_SAMPLE_RATE": env_config.get("SENTRY_TRACES_SAMPLE_RATE"),
            "REDIS_URL": env_config.get("REDIS_URL"),
            "KEYCLOAK_SERVER_URL": env_config.get("KEYCLOAK_SERVER_URL"),
            "KEYCLOAK_CLIENT_ID": env_config.get("BITSWAN_BACKEND_KEYCLOAK_CLIENT_ID"),
            "KEYCLOAK_REALM_NAME": env_config.get("KEYCLOAK_REALM_NAME"),
            "AUTH_SECRET_KEY": env_config.get("AUTH_SECRET_KEY"),
            "CORS_ALLOWED_ORIGINS": env_config.get("CORS_ALLOWED_ORIGINS"),
            "USE_DOCKER": env_config.get("USE_DOCKER"),
            "DJANGO_READ_DOT_ENV_FILE": env_config.get("DJANGO_READ_DOT_ENV_FILE"),
            "EMQX_JWT_SECRET": env_config.get("EMQX_AUTHENTICATION__1__SECRET"),
            "EMQX_EXTERNAL_URL": env_config.get("EMQX_EXTERNAL_URL"),
            "EMQX_INTERNAL_URL": env_config.get("EMQX_INTERNAL_URL"),
            "DATABASE_URL": DATABASE_URL,
        }
    }

    if init_config.dev_setup == DevSetupKind.LOCAL:
        env_vars.update(
            {
                "Postgres Config": {
                    "POSTGRES_HOST": POSTGRES_HOST,
                    "POSTGRES_PORT": POSTGRES_PORT,
                    "POSTGRES_USER": POSTGRES_USER,
                    "POSTGRES_PASSWORD": POSTGRES_PASSWORD,
                    "POSTGRES_DB": POSTGRES_DB,
                }
            }
        )

    bootstrap_service(
        service_name="Bitswan Backend",
        environment=init_config.env,
        env_vars=env_vars,
        project_name="bitswan-backend",
        deployment_kind=init_config.dev_setup.value,
        env_file=(
            ".env"
            if init_config.dev_setup == DevSetupKind.LOCAL
            else "bitswan-backend.env"
        ),
        aoc_dir=init_config.aoc_dir,
    )


def bootsrap_bitswan_backend_db(
    init_config: InitConfig, env_config: dict[str, str] = None
) -> None:
    """Bootstrap Bitswan Backend DB environment variables."""
    env_config = env_config or {}

    bootstrap_service(
        service_name="Bitswan Backend DB",
        environment=init_config.env,
        env_vars={
            "BITSWAN_BACKEND_DB": {
                "POSTGRES_HOST": env_config.get("BITSWAN_BACKEND_POSTGRES_HOST"),
                "POSTGRES_PORT": env_config.get("BITSWAN_BACKEND_POSTGRES_PORT"),
                "POSTGRES_USER": env_config.get("BITSWAN_BACKEND_POSTGRES_USER"),
                "POSTGRES_PASSWORD": env_config.get(
                    "BITSWAN_BACKEND_POSTGRES_PASSWORD"
                ),
                "POSTGRES_DB": env_config.get("BITSWAN_BACKEND_POSTGRES_DB"),
            }
        },
        env_file="bitswan-backend-postgres.env",
        aoc_dir=init_config.aoc_dir,
    )


def bootstrap_operations_centre(
    init_config: InitConfig, env_config: dict[str, str] = None
) -> None:
    """Bootstrap Operations Centre environment variables."""
    env_config = env_config or {}

    bootstrap_service(
        service_name="Operations Centre",
        environment=init_config.env,
        env_vars={
            "NextAuth": {
                "AUTH_URL": env_config.get("AUTH_URL"),
                "AUTH_SECRET": env_config.get("AUTH_SECRET"),
            },
            "InfluxDB": {
                "INFLUXDB_URL": env_config.get("INFLUXDB_URL"),
                "INFLUXDB_ORG": env_config.get("INFLUXDB_ORG"),
                "INFLUXDB_BUCKET": env_config.get("INFLUXDB_BUCKET"),
                "INFLUXDB_USERNAME": env_config.get("INFLUXDB_USERNAME"),
                "INFLUXDB_TOKEN": env_config.get("INFLUXDB_TOKEN"),
            },
            "Bitswan Backend": {
                "NEXT_PUBLIC_BITSWAN_BACKEND_API_URL": env_config.get(
                    "NEXT_PUBLIC_BITSWAN_BACKEND_API_URL"
                ),
                "BITSWAN_BACKEND_API_URL": env_config.get("BITSWAN_BACKEND_API_URL"),
            },
            "EMQX": {
                "EMQX_JWT_SECRET": env_config.get("EMQX_AUTHENTICATION__1__SECRET"),
                "EMQX_MQTT_URL": env_config.get("EMQX_MQTT_URL"),
            },
            "Keycloak": {
                "KEYCLOAK_ISSUER": env_config.get("KEYCLOAK_ISSUER"),
                "KEYCLOAK_CLIENT_ID": env_config.get("KEYCLOAK_CLIENT_ID"),
                "KEYCLOAK_REFRESH_URL": env_config.get("KEYCLOAK_REFRESH_URL"),
                "KEYCLOAK_END_SESSION_URL": env_config.get("KEYCLOAK_END_SESSION_URL"),
                "KEYCLOAK_POST_LOGOUT_REDIRECT_URI": env_config.get(
                    "KEYCLOAK_POST_LOGOUT_REDIRECT_URI"
                ),
            },
            "Sentry": {
                "SENTRY_IGNORE_API_RESOLUTION_ERROR": env_config.get(
                    "SENTRY_IGNORE_API_RESOLUTION_ERROR"
                ),
                "SENTRY_AUTH_TOKEN": env_config.get("SENTRY_AUTH_TOKEN"),
                "SENTRY_DSN": env_config.get("SENTRY_DSN"),
            },
        },
        deployment_kind=init_config.dev_setup.value,
        project_name="aoc",
        env_file=(
            ".env"
            if init_config.dev_setup == DevSetupKind.LOCAL
            else OPERATIONS_CENTRE_DOCKER_ENV_FILE
        ),
        aoc_dir=init_config.aoc_dir,
    )


def bootstrap_emqx(init_config: InitConfig, env_config: dict[str, str] = None) -> None:
    """Bootstrap EMQX environment variables."""
    env_config = env_config or {}

    bootstrap_service(
        service_name="EMQX",
        environment=init_config.env,
        env_vars={
            "EMQX": {
                "EMQX_HOST": env_config.get("EMQX_HOST"),
                "EMQX_PORT": env_config.get("EMQX_PORT"),
                "EMQX_USER": env_config.get("EMQX_USER"),
                "EMQX_DASHBOARD__DEFAULT_PASSWORD": env_config.get(
                    "EMQX_DASHBOARD__DEFAULT_PASSWORD"
                ),
            },
            "JWT Authentication": {
                "EMQX_AUTHENTICATION__1__SECRET": env_config.get(
                    "EMQX_AUTHENTICATION__1__SECRET"
                ),
                "EMQX_AUTHENTICATION__1__MECHANISM": env_config.get(
                    "EMQX_AUTHENTICATION__1__MECHANISM"
                ),
                "EMQX_AUTHENTICATION__1__FROM": env_config.get(
                    "EMQX_AUTHENTICATION__1__FROM"
                ),
                "EMQX_AUTHENTICATION__1__USE_JWKS": env_config.get(
                    "EMQX_AUTHENTICATION__1__USE_JWKS"
                ),
                "EMQX_AUTHENTICATION__1__ALGORITHM": env_config.get(
                    "EMQX_AUTHENTICATION__1__ALGORITHM"
                ),
            },
        },
        aoc_dir=init_config.aoc_dir,
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
