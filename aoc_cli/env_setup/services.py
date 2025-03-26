import click

from aoc_cli.config import Environment
from aoc_cli.env_setup.utils import bootstrap_service


def bootstrap_influx_db(
    environment: Environment, env_config: dict[str, str] = None
) -> None:
    """Bootstrap InfluxDB environment variables."""
    env_config = env_config or {}

    bootstrap_service(
        service_name="InfluxDB",
        environment=environment,
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
    )


def bootstrap_keycloak(
    environment: Environment, env_config: dict[str, str] = None
) -> None:
    """Bootstrap Keycloak environment variables."""
    env_config = env_config or {}

    bootstrap_service(
        service_name="Keycloak",
        environment=environment,
        env_vars={
            "Keycloak Service Configuration": {
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
            }
        },
    )


def bootstrap_keycloak_db(
    environment: Environment, env_config: dict[str, str] = None
) -> None:
    """Bootstrap Keycloak DB environment variables."""
    env_config = env_config or {}

    bootstrap_service(
        service_name="Keycloak DB",
        environment=environment,
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
    )


def bootstrap_bitswan_backend(
    environment: Environment, env_config: dict[str, str] = None
) -> None:
    """Bootstrap Bitswan Backend environment variables."""
    env_config = env_config or {}

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
        }
    }

    bootstrap_service(
        service_name="Bitswan Backend",
        environment=environment,
        env_vars=env_vars,
        env_file="bitswan-backend.env",
    )


def bootsrap_bitswan_backend_db(
    environment: Environment, env_config: dict[str, str] = None
) -> None:
    """Bootstrap Bitswan Backend DB environment variables."""
    env_config = env_config or {}

    bootstrap_service(
        service_name="Bitswan Backend DB",
        environment=environment,
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
    )


def bootstrap_operations_centre(
    environment: Environment, env_config: dict[str, str] = None
) -> None:
    """Bootstrap Operations Centre environment variables."""
    env_config = env_config or {}

    bootstrap_service(
        service_name="Operations Centre",
        environment=environment,
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
            "CDS": {
                "CDS_API_URL": env_config.get("CDS_API_URL"),
            },
            "Bitswan Backend": {
                "NEXT_PUBLIC_BITSWAN_BACKEND_API_URL": env_config.get(
                    "NEXT_PUBLIC_BITSWAN_BACKEND_API_URL"
                ),
                "BITSWAN_BACKEND_API_URL": env_config.get("BITSWAN_BACKEND_API_URL"),
            },
            "EMQX": {
                "EMQX_JWT_SECRET": env_config.get("EMQX_JWT_SECRET"),
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
        deployment_kind="local" if environment == Environment.DEV else "docker",
        project_name="aoc",
        env_file=".env" if environment == Environment.DEV else None,
    )


def bootstrap_emqx(environment: Environment, env_config: dict[str, str] = None) -> None:
    """Bootstrap EMQX environment variables."""
    env_config = env_config or {}

    bootstrap_service(
        service_name="EMQX",
        environment=environment,
        env_vars={
            "EMQX": {
                "EMQX_HOST": env_config.get("EMQX_HOST"),
                "EMQX_PORT": env_config.get("EMQX_PORT"),
                "EMQX_USER": env_config.get("EMQX_USER"),
                "EMQX_PASSWORD": env_config.get("EMQX_PASSWORD"),
            }
        },
    )


def bootstrap_services(
    environment: Environment, env_config: dict[str, str] = None
) -> None:
    """Bootstrap all services environment variables."""
    env_config = env_config or {}
    click.echo("\nBootstrapping Services Environment Variables")

    bootstrap_operations_centre(environment, env_config)
    bootstrap_influx_db(environment, env_config)
    bootstrap_keycloak(environment, env_config)
    bootstrap_keycloak_db(environment, env_config)
    bootstrap_bitswan_backend(environment, env_config)
    bootsrap_bitswan_backend_db(environment, env_config)
    bootstrap_emqx(environment, env_config)
