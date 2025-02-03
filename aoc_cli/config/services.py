from dataclasses import dataclass
from enum import Enum
from typing import Dict, Optional, Set

from aoc_cli.config import (
    BITSWAN_BACKEND_ENV_FILE,
    BITSWAN_DB_ENV_FILE,
    EMQX_ENV_FILE,
    INFLUXDB_ENV_FILE,
    KEYCLOAK_DB_ENV_FILE,
    KEYCLOAK_ENV_FILE,
    OPERATIONS_CENTRE_ENV_FILE,
)


class Protocol(Enum):
    HTTP = "http"
    HTTPS = "https"


@dataclass
class ServiceConfig:
    name: str
    env_vars: Set[str]
    env_file_path: str

    # Mapping internal variables to Docker service variables
    variable_mapping: Optional[Dict[str, str]] = None


class Services:

    INFLUXDB = ServiceConfig(
        name="influxdb",
        env_vars={
            "INFLUXDB_URL",
            "DOCKER_INFLUXDB_INIT_ORG",
            "DOCKER_INFLUXDB_INIT_BUCKET",
            "DOCKER_INFLUXDB_INIT_USERNAME",
            "DOCKER_INFLUXDB_INIT_PASSWORD",
        },
        env_file_path=INFLUXDB_ENV_FILE,
    )

    KEYCLOAK = ServiceConfig(
        name="keycloak",
        env_vars={
            "KC_DB_PASSWORD",
            "KEYCLOAK_ADMIN_PASSWORD",
            "KEYCLOAK_ADMIN",
            "KEYCLOAK_CLIENT_ID",
            "KEYCLOAK_REFRESH_URL",
            "KC_HOSTNAME_URL",
            "PROXY_ADDRESS_FORWARDING",
            "KC_PROXY",
            "KEYCLOAK_ISSUER",
            "KC_DB",
            "DB_ADDR",
            "KC_DB_URL_HOST",
            "KC_DB_URL_DATABASE",
            "KC_DB_USERNAME",
        },
        env_file_path=KEYCLOAK_ENV_FILE,
    )

    # Internal names are prefixed, but we map them to the expected Docker variables
    # This is because Keycloak uses the same database as the DB service used by Bitswan Backend
    KEYCLOAK_DB = ServiceConfig(
        name="keycloak-postgres",
        env_vars={
            "KEYCLOAK_POSTGRES_USER",
            "KEYCLOAK_POSTGRES_PASSWORD",
            "KEYCLOAK_POSTGRES_DB",
            "KEYCLOAK_POSTGRES_HOST",
            "KEYCLOAK_POSTGRES_PORT",
        },
        env_file_path=KEYCLOAK_DB_ENV_FILE,
        variable_mapping={
            "KEYCLOAK_POSTGRES_USER": "POSTGRES_USER",
            "KEYCLOAK_POSTGRES_PASSWORD": "POSTGRES_PASSWORD",
            "KEYCLOAK_POSTGRES_DB": "POSTGRES_DB",
            "KEYCLOAK_POSTGRES_HOST": "POSTGRES_HOST",
            "KEYCLOAK_POSTGRES_PORT": "POSTGRES_PORT",
        },
    )

    BITSWAN_DB = ServiceConfig(
        name="bitswan-postgres",
        env_vars={
            "BITSWAN_POSTGRES_USER",
            "BITSWAN_POSTGRES_PASSWORD",
            "BITSWAN_POSTGRES_DB",
            "BITSWAN_POSTGRES_HOST",
            "BITSWAN_POSTGRES_PORT",
        },
        env_file_path=BITSWAN_DB_ENV_FILE,
        variable_mapping={
            "BITSWAN_POSTGRES_USER": "POSTGRES_USER",
            "BITSWAN_POSTGRES_PASSWORD": "POSTGRES_PASSWORD",
            "BITSWAN_POSTGRES_DB": "POSTGRES_DB",
            "BITSWAN_POSTGRES_HOST": "POSTGRES_HOST",
            "BITSWAN_POSTGRES_PORT": "POSTGRES_PORT",
        },
    )

    BITSWAN_BACKEND = ServiceConfig(
        name="bitswan-backend",
        env_vars={
            "DJANGO_SETTINGS_MODULE",
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
            "CELERY_FLOWER_USER",
            "CELERY_FLOWER_PASSWORD",
            "GITOPS_IDE_HOST",
            "RATHOLE_SERVER_HOST",
            "RATHOLE_CONFIG_PATH",
            "TRAEFIK_SERVER_HOST",
            "TRAEFIK_CONFIG_PATH",
            "KEYCLOAK_SERVER_URL",
            "BITSWAN_BACKEND_KEYCLOAK_CLIENT_ID",
            "KEYCLOAK_REALM_NAME",
            "KEYCLOAK_CLIENT_SECRET_KEY",
            "AUTH_SECRET_KEY",
            "CORS_ALLOWED_ORIGINS",
            "USE_DOCKER",
        },
        env_file_path=BITSWAN_BACKEND_ENV_FILE,
        variable_mapping={
            "BITSWAN_BACKEND_KEYCLOAK_CLIENT_ID": "KEYCLOAK_CLIENT_ID",
        },
    )

    OPERATIONS_CENTRE = ServiceConfig(
        name="operations-centre",
        env_vars={
            "NEXTAUTH_URL",
            "NEXTAUTH_SECRET",
            "INFLUXDB_URL",
            "INFLUXDB_ORG",
            "INFLUXDB_BUCKET",
            "INFLUXDB_USERNAME",
            "INFLUXDB_TOKEN",
            "CDS_API_URL",
            "NEXT_PUBLIC_BITSWAN_BACKEND_API_URL",
            "EMQX_JWT_SECRET",
            "EMQX_MQTT_URL",
            "INFLUXDB_PASSWORD",
            "KEYCLOAK_ISSUER",
            "KEYCLOAK_END_SESSION_URL",
            "KEYCLOAK_POST_LOGOUT_REDIRECT_URI",
            "KEYCLOAK_FRONTEND_URL",
            "KEYCLOAK_ADMIN_URL",
            "KEYCLOAK_REFRESH_URL",
            "KEYCLOAK_CLIENT_ID",
            "PORTAINER_BASE_URL",
            "NEXT_PUBLIC_MQTT_URL",
            "PREPARE_MQTT_SERVICE_URL",
            "CCS_CONFIG_KEY",
            "CDS_API_URL",
        },
        env_file_path=OPERATIONS_CENTRE_ENV_FILE,
    )

    EMQX = ServiceConfig(
        name="emqx",
        env_vars={
            "EMQX_DASHBOARD__DEFAULT_PASSWORD",
        },
        env_file_path=EMQX_ENV_FILE,
    )
