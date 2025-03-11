from typing import Dict

from aoc_cli.config import Environment, InitConfig


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

    env_name = "local" if config.env.value == "dev" else "production"

    aoc_url = (
        f"{protocol}://aoc.{domain}"
        if config.env == Environment.PROD
        else "http://localhost:3000"
    )

    influxdb_url = (
        f"{protocol}://aoc-influxdb:8086/"
        if config.env == Environment.PROD
        else "http://localhost:8086"
    )

    bitswan_backend_url = (
        f"{protocol}://bitswan-backend:5000"
        if config.env == Environment.PROD
        else "http://localhost:8000"
    )

    emqx_url = (
        "mqtt://aoc-emqx:1883"
        if config.env == Environment.PROD
        else "mqtt://localhost:1883"
    )

    keycloak_url = (
        f"{protocol}://keycloak.{domain}"
        if config.env == Environment.PROD
        else "http://localhost:10000"
    )

    defaults = {
        "INFLUXDB_URL": influxdb_url,
        "INFLUXDB_ORG": "pipeline-operations-centre",
        "DOCKER_INFLUXDB_INIT_ORG": "pipeline-operations-centre",
        "INFLUXDB_BUCKET": "pipeline-metrics",
        "DOCKER_INFLUXDB_INIT_BUCKET": "pipeline-metrics",
        "INFLUXDB_USERNAME": "pipeline-operations-centre",
        "INFLUXDB_TOKEN": "randominfluxdbtoken",
        "DOCKER_INFLUXDB_INIT_USERNAME": "pipeline-operations-centre",
        # Postgres defaults - using internal names for Keycloak and Bitswan backend postgres instances
        "BITSWAN_BACKEND_POSTGRES_USER": "postgres",
        "BITSWAN_BACKEND_POSTGRES_DB": "bitswan_backend",
        "BITSWAN_BACKEND_POSTGRES_HOST": f"aoc-{env_name}-bitswan-backend-postgres",
        "BITSWAN_BACKEND_POSTGRES_PORT": "5432",
        "BITSWAN_BACKEND_POSTGRES_PASSWORD": "postgres",
        # ---  End of Postgres defaults
        "KC_HOSTNAME_URL": f"http://aoc-{env_name}-keycloak:8080",
        "PROXY_ADDRESS_FORWARDING": "true",
        "EMQX_MQTT_URL": emqx_url,
        "KC_PROXY": "edge",
        "KC_DB": "postgres",
        "DB_ADDR": "postgres",
        "KC_DB_URL_HOST": f"aoc-{env_name}-keycloak-postgres",
        "KC_DB_URL_DATABASE": "postgres",
        "KC_DB_PASSWORD": "postgres",
        "KC_DB_USERNAME": "postgres",
        "KC_DB_PORT": "5432",
        "PORTAINER_BASE_URL": "http://aoc-portainer:9000/",
        "MQTT_URL": "mqtt://aoc-mosquito:1883",
        "PREPARE_MQTT_SERVICE_URL": "http://container-config-service:8080/trigger",
        "NEXT_PUBLIC_MQTT_URL": f"{protocol}://mqtt.{domain}/",
        # Automation Operations Centre
        "CDS_API_URL": f"{protocol}://aoc-cds-api:8080/api",
        "EMQX_JWT_SECRET": "test",
        "NEXTAUTH_URL": aoc_url,
        "AUTH_URL": aoc_url,
        "KC_PROXY_HEADERS": "forwarded",
        "KC_HTTP_ENABLED": "true",
        "KC_HOSTNAME_STRICT": "false",
        "KC_HOSTNAME_STRICT_HTTPS": "false",
        "KEYCLOAK_ADMIN": "admin",
        "KEYCLOAK_CLIENT_ID": "aoc-frontend",  # Probably needs to be set in keycloak service
        "KEYCLOAK_REFRESH_URL": f"{keycloak_url}/realms/master/protocol/openid-connect/token",
        "KEYCLOAK_ISSUER": f"{keycloak_url}/realms/master",
        "KEYCLOAK_END_SESSION_URL": f"{keycloak_url}/realms/master/protocol/openid-connect/logout",
        "KEYCLOAK_POST_LOGOUT_REDIRECT_URI": aoc_url,
        "KEYCLOAK_FRONTEND_URL": config.get_url("keycloak"),
        "KEYCLOAK_SSL_VERIFY": 1,
        "KEYCLOAK_ADMIN_URL": config.get_url("keycloak"),
        "NEXT_PUBLIC_BITSWAN_BACKEND_API_URL": bitswan_backend_url,
        "BITSWAN_BACKEND_API_URL": bitswan_backend_url,
        #
        "DJANGO_SETTINGS_MODULE": (
            "config.settings.production"
            if config.env == Environment.PROD
            else "config.settings.local"
        ),
        "DJANGO_ADMIN_URL": "j2ClKNry4Dqlt022mBiYza2z81afm5ou/",
        "DJANGO_ALLOWED_HOSTS": f"api.{domain},bitswan-backend:5000,bitswan-backend,http://localhost:3000",
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
        "KEYCLOAK_SERVER_URL": f"http://aoc-{env_name}-keycloak:8080",
        "CORS_ALLOWED_ORIGINS": f"http://localhost:3000,{protocol}://aoc.{domain}",
        # EMQX
        "EMQX_HOST": "aoc-emqx",
        "EMQX_PORT": "1883",
        "EMQX_USER": "admin",
        "EMQX_PASSWORD": "admin",
        "EMQX_DASHBOARD__DEFAULT_PASSWORD": "admin",
    }

    if custom_defaults:
        defaults.update(custom_defaults)

    return defaults
