from typing import Dict

from aoc_cli.config import InitConfig


def get_var_defaults(
    config: InitConfig, custom_defaults: Dict[str, str] = None
) -> Dict[str, str]:
    """
    Get default values for all variables with optional custom overrides

    Args:
        config: PlatformConfig object containing protocol and domain information
        custom_defaults: Optional dictionary of key-value pairs to override or add to defaults

    Returns:
        Dictionary containing all default values with any custom overrides applied
    """

    protocol = config.protocol.value
    domain = config.domain

    defaults = {
        "INFLUXDB_URL": "http://aoc-influxdb:8086/",
        "INFLUXDB_ORG": "pipeline-operations-centre",
        "DOCKER_INFLUXDB_INIT_ORG": "pipeline-operations-centre",
        "INFLUXDB_BUCKET": "pipeline-metrics",
        "DOCKER_INFLUXDB_INIT_BUCKET": "pipeline-metrics",
        "INFLUXDB_USERNAME": "pipeline-operations-centre",
        "INFLUXDB_TOKEN": "randominfluxdbtoken",
        "DOCKER_INFLUXDB_INIT_USERNAME": "pipeline-operations-centre",
        # Postgres defaults - using internal names for Keycloak and Bitswan backend postgres instances
        "KEYCLOAK_POSTGRES_USER": "postgres",
        "KEYCLOAK_POSTGRES_DB": "postgres",
        "KEYCLOAK_POSTGRES_HOST": "aoc-keycloak-postgres",
        "KEYCLOAK_POSTGRES_PORT": "5432",
        "BITSWAN_POSTGRES_USER": "postgres",
        "BITSWAN_POSTGRES_DB": "bitswan_backend",
        "BITSWAN_POSTGRES_HOST": "bitswan-backend-postgres",
        "BITSWAN_POSTGRES_PORT": "5432",
        # ---  End of Postgres defaults
        "KC_HOSTNAME_URL": config.get_url("keycloak"),
        "PROXY_ADDRESS_FORWARDING": "true",
        "EMQX_MQTT_URL": "mqtt://aoc-emqx:1883",
        "KC_PROXY": "edge",
        "KC_DB": "postgres",
        "DB_ADDR": "postgres",
        "KC_DB_URL_HOST": "aoc-keycloak-postgres",
        "KC_DB_URL_DATABASE": "postgres",
        "KC_DB_USERNAME": "postgres",
        "PORTAINER_BASE_URL": "http://aoc-portainer:9000/",
        "MQTT_URL": "mqtt://aoc-mosquito:1883",
        "PREPARE_MQTT_SERVICE_URL": "http://container-config-service:8080/trigger",
        "NEXT_PUBLIC_MQTT_URL": f"{protocol}://mqtt.{domain}/",
        # Automation Operations Centre
        "CDS_API_URL": f"{protocol}://aoc-cds-api:8080/api",
        "EMQX_JWT_SECRET": "test",
        "NEXTAUTH_URL": config.get_url("aoc"),
        "AUTH_URL": config.get_url("aoc"),
        "KEYCLOAK_ADMIN": "admin",
        "KEYCLOAK_CLIENT_ID": "aoc-frontend",  # Probably needs to be set in keycloak service
        "KEYCLOAK_REFRESH_URL": f"{protocol}://keycloak.{domain}/realms/master/protocol/openid-connect/token",
        "KEYCLOAK_ISSUER": f"{protocol}://keycloak.{domain}/realms/master",
        "KEYCLOAK_END_SESSION_URL": f"{protocol}://keycloak.{domain}/realms/master/protocol/openid-connect/logout",
        "KEYCLOAK_POST_LOGOUT_REDIRECT_URI": config.get_url("aoc"),
        "KEYCLOAK_FRONTEND_URL": config.get_url("keycloak"),
        "KEYCLOAK_ADMIN_URL": config.get_url("keycloak"),
        "NEXT_PUBLIC_BITSWAN_BACKEND_API_URL": f"{protocol}://bitswan-backend:5000",
        "BITSWAN_BACKEND_API_URL": f"{protocol}://bitswan-backend:5000",
        #
        "DJANGO_SETTINGS_MODULE": "config.settings.production",
        "DJANGO_ADMIN_URL": "j2ClKNry4Dqlt022mBiYza2z81afm5ou/",
        "DJANGO_ALLOWED_HOSTS": f"api.{domain},bitswan-backend:5000,bitswan-backend",
        "DJANGO_SECURE_SSL_REDIRECT": "False",
        "DJANGO_SERVER_EMAIL": "",
        "DJANGO_ACCOUNT_ALLOW_REGISTRATION": "True",
        "WEB_CONCURRENCY": 4,
        "SENTRY_DSN": "",
        "SENTRY_TRACES_SAMPLE_RATE": 1.0,
        "REDIS_URL": "redis://aoc-redis:6379/0",
        "USE_DOCKER": "yes",
        "BITSWAN_BACKEND_KEYCLOAK_CLIENT_ID": "bitswan-backend",
        "KEYCLOAK_REALM_NAME": "master",
        "KEYCLOAK_SERVER_URL": f"{protocol}://keycloak.{domain}",
        "CORS_ALLOWED_ORIGINS": f"http://localhost:3000,{protocol}://aoc.{domain}",
    }

    if custom_defaults:
        defaults.update(custom_defaults)

    return defaults
