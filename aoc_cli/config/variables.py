from dataclasses import dataclass
from typing import Dict

from aoc_cli.config.services import Protocol


@dataclass
class PlatformConfig:
    domain: str
    protocol: Protocol

    def get_url(self, subdomain: str) -> str:
        return f"{self.protocol.value}://{subdomain}.{self.domain}"


def get_var_defaults(config: PlatformConfig) -> Dict[str, str]:
    """Get default values for all variables"""

    protocol = config.protocol.value
    domain = config.domain

    return {
        "NEXTAUTH_URL": config.get_url("poc"),
        "INFLUXDB_URL": "http://influxdb:8086/",
        "INFLUXDB_ORG": "pipeline-operations-centre",
        "DOCKER_INFLUXDB_INIT_ORG": "pipeline-operations-centre",
        "INFLUXDB_BUCKET": "pipeline-metrics",
        "DOCKER_INFLUXDB_INIT_BUCKET": "pipeline-metrics",
        "INFLUXDB_USERNAME": "pipeline-operations-centre",
        "DOCKER_INFLUXDB_INIT_USERNAME": "pipeline-operations-centre",
        # Postgres defaults - using internal names for Keycloak and Bitswan backend postgres instances
        "KEYCLOAK_POSTGRES_USER": "postgres",
        "KEYCLOAK_POSTGRES_DB": "keycloak",
        "KEYCLOAK_POSTGRES_HOST": "postgres",
        "KEYCLOAK_POSTGRES_PORT": "5432",
        "BITSWAN_POSTGRES_USER": "postgres",
        "BITSWAN_POSTGRES_DB": "bitswan_backend",
        "BITSWAN_POSTGRES_HOST": "bitswan-backend-postgres",
        "BITSWAN_POSTGRES_PORT": "5432",
        # ---  End of Postgres defaults
        "KEYCLOAK_ADMIN": "admin",
        "KEYCLOAK_CLIENT_ID": "bitswan-admin-dashboard",
        "KEYCLOAK_REFRESH_URL": "http://keycloak:8080/realms/master/protocol/openid-connect/token",
        "KEYCLOAK_ISSUER": "https://keycloak:8080/realms/master",
        "KEYCLOAK_END_SESSION_URL": f"{protocol}://keycloak.{domain}/realms/master/protocol/openid-connect/logout",
        "KEYCLOAK_POST_LOGOUT_REDIRECT_URI": config.get_url("poc"),
        "KEYCLOAK_FRONTEND_URL": config.get_url("keycloak"),
        "KEYCLOAK_ADMIN_URL": config.get_url("keycloak"),
        "KC_HOSTNAME_URL": config.get_url("keycloak"),
        "PROXY_ADDRESS_FORWARDING": "true",
        "KC_PROXY": "edge",
        "KC_DB": "postgres",
        "DB_ADDR": "postgres",
        "KC_DB_URL_HOST": "postgres",
        "KC_DB_URL_DATABASE": "postgres",
        "KC_DB_USERNAME": "postgres",
        "PORTAINER_BASE_URL": "http://portainer:9000/",
        "MQTT_URL": "mqtt://mosquito:1883",
        "PREPARE_MQTT_SERVICE_URL": "http://container-config-service:8080/trigger",
        "NEXT_PUBLIC_MQTT_URL": f"{protocol}://mqtt.{domain}/",
        "DJANGO_ADMIN_URL": f"{protocol}://poc.{domain}/admin/",
        "REDIS_URL": "redis://redis:6379/0",
        "USE_DOCKER": "yes",
    }
