from dataclasses import dataclass
from enum import Enum
from typing import Dict, Optional, Set


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
        env_file_path="docker-compose/.influxdb.env",
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
            "KC_DB_PASSWORD",
        },
        env_file_path="docker-compose/.keycloak.env",
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
        env_file_path="docker-compose/.keycloak-postgres.env",
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
        env_file_path="docker-compose/.bitswan-backend-postgres.env",
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
            "DJANGO_SECRET_KEY",
            "DJANGO_ADMIN_URL",
            "AUTH_SECRET_KEY",
            "REDIS_URL",
            "USE_DOCKER",
        },
        env_file_path="docker-compose/.bitswan-backend.env",
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
        },
        env_file_path="docker-compose/.operations-centre.env",
    )

    EMQX = ServiceConfig(
        name="emqx",
        env_vars={
            "EMQX_DASHBOARD__DEFAULT_PASSWORD",
        },
        env_file_path="docker-compose/.emqx.env",
    )
