from dataclasses import dataclass
from typing import Callable, Dict, Optional, Union

from aoc_cli.env.config import DevSetupKind, Environment, InitConfig


@dataclass
class ServiceConfig:
    """Configuration for a service including its base properties and environment variables"""

    name: str
    url_pattern: str
    port: int
    env_vars: Dict[
        str, Union[str, Callable[["InitConfig", Dict[str, "ServiceConfig"]], str]]
    ]

    def get_url(self, config: "InitConfig", internal: bool = False) -> str:
        """Generate URL for this service based on environment"""
        if config.env == Environment.PROD:
            return f"{config.protocol.value}://{self.url_pattern.format(domain=config.domain)}"
        elif internal and (config.dev_setup == DevSetupKind.DOCKER):
            # Use Docker internal networking name
            return f"http://{self.name}:{self.port}"
        else:
            # Local development
            return f"http://localhost:{self.port}"

    def get_env_vars(
        self, config: "InitConfig", all_services: Dict[str, "ServiceConfig"]
    ) -> Dict[str, str]:
        """Get environment variables for this service"""
        result = {}
        for key, value_template in self.env_vars.items():
            if callable(value_template):
                result[key] = value_template(config, all_services)
            else:
                result[key] = value_template.format(
                    domain=config.domain,
                    protocol=config.protocol.value,
                    env_name="local" if config.env == Environment.DEV else "production",
                    use_docker=(
                        "yes" if config.dev_setup == DevSetupKind.DOCKER else "no"
                    ),
                    read_dot_env_file=(
                        "True" if config.dev_setup == DevSetupKind.LOCAL else "False"
                    ),
                    keycloak_url=all_services.get("keycloak").get_url(
                        config, internal=False
                    ),
                    **{
                        service_id: service.get_url(config, internal=True)
                        for service_id, service in all_services.items()
                    },
                )
        return result


# Define all services
def create_service_configs(env_name: str, env: Environment) -> Dict[str, ServiceConfig]:
    """Create configuration for all services"""
    services = {}

    # InfluxDB Service
    services["influxdb"] = ServiceConfig(
        name=f"aoc-{env_name}-influxdb",
        url_pattern="influxdb.{domain}",
        port=8086,
        env_vars={
            "INFLUXDB_URL": lambda cfg, svcs: svcs["influxdb"].get_url(
                cfg, internal=True
            )
            + "/",
            "INFLUXDB_ORG": "pipeline-operations-centre",
            "DOCKER_INFLUXDB_INIT_ORG": "pipeline-operations-centre",
            "INFLUXDB_BUCKET": "pipeline-metrics",
            "DOCKER_INFLUXDB_INIT_BUCKET": "pipeline-metrics",
            "INFLUXDB_USERNAME": "pipeline-operations-centre",
            "INFLUXDB_TOKEN": "randominfluxdbtoken",
            "DOCKER_INFLUXDB_INIT_USERNAME": "pipeline-operations-centre",
        },
    )

    # Keycloak Service
    services["keycloak"] = ServiceConfig(
        name=f"aoc-{env_name}-keycloak",
        url_pattern="keycloak.{domain}",
        port=8080,
        env_vars={
            "KC_HOSTNAME_URL": lambda cfg, svcs: svcs["keycloak"].get_url(cfg),
            "PROXY_ADDRESS_FORWARDING": "true",
            "KC_PROXY": "edge",
            "KC_PROXY_HEADERS": "forwarded",
            "KC_HTTP_ENABLED": "true",
            "KC_HOSTNAME_STRICT": "false",
            "KC_HOSTNAME_STRICT_HTTPS": "false",
            "KC_HEALTH_ENABLED": "true",
            "KC_FEATURES": "preview,token-exchange",
            "KEYCLOAK_ADMIN": "admin",
            "KEYCLOAK_CLIENT_ID": "aoc-frontend",
            "KEYCLOAK_REFRESH_URL": "{keycloak_url}/realms/master/protocol/openid-connect/token",
            "KEYCLOAK_ISSUER": "{keycloak_url}/realms/master",
            "KEYCLOAK_END_SESSION_URL": "{keycloak_url}/realms/master/protocol/openid-connect/logout",
            "KEYCLOAK_REALM_NAME": "master",
            "KEYCLOAK_FRONTEND_URL": lambda cfg, svcs: svcs["keycloak"].get_url(cfg),
            "KEYCLOAK_ADMIN_URL": lambda cfg, svcs: svcs["keycloak"].get_url(cfg),
            "KEYCLOAK_SERVER_URL": lambda cfg, svcs: svcs["keycloak"].get_url(
                cfg, internal=True
            ),
        },
    )

    # Keycloak DB
    services["keycloak_db"] = ServiceConfig(
        name=f"aoc-{env_name}-keycloak-postgres",
        url_pattern="keycloak-db.{domain}",
        port=5432,
        env_vars={
            "KC_DB": "postgres",
            "DB_ADDR": "postgres",
            "KC_DB_URL_HOST": lambda cfg, svcs: svcs["keycloak_db"].name.format(
                env_name="local" if cfg.env == Environment.DEV else "production"
            ),
            "KC_DB_URL_DATABASE": "postgres",
            "KC_DB_PASSWORD": "postgres",
            "KC_DB_USERNAME": "postgres",
            "KC_DB_PORT": "5432",
        },
    )

    # Bitswan Backend
    services["bitswan_backend"] = ServiceConfig(
        name=f"aoc-{env_name}-bitswan-backend",
        url_pattern="api.{domain}",
        port=5000 if env == Environment.PROD else 8000,
        env_vars={
            "DJANGO_SETTINGS_MODULE": lambda cfg, svcs: (
                "config.settings.production"
                if cfg.env == Environment.PROD
                else "config.settings.local"
            ),
            "DJANGO_ADMIN_URL": "j2ClKNry4Dqlt022mBiYza2z81afm5ou/",
            "DJANGO_ALLOWED_HOSTS": (
                "api.{domain}," "aoc-{env_name}-bitswan-backend,http://localhost:3000"
            ),
            "DJANGO_SECURE_SSL_REDIRECT": "False",
            "DJANGO_SERVER_EMAIL": "",
            "DJANGO_ACCOUNT_ALLOW_REGISTRATION": "True",
            "BITSWAN_BACKEND_KEYCLOAK_CLIENT_ID": "bitswan-backend",
            "CORS_ALLOWED_ORIGINS": (
                "http://localhost:3000,{protocol}://aoc.{domain},"
                "{protocol}://aoc-{env_name}-nextjs:3000"
            ),
            "EMQX_EXTERNAL_URL": lambda cfg, svcs: (
                f"aoc-{env_name}-emqx:1883"
                if cfg.env == Environment.PROD or cfg.dev_setup == DevSetupKind.DOCKER
                else "localhost:1883"
            ),
            "WEB_CONCURRENCY": "4",
            "SENTRY_TRACES_SAMPLE_RATE": "1.0",
            "USE_DOCKER": "{use_docker}",
            "DJANGO_READ_DOT_ENV_FILE": "{read_dot_env_file}",
        },
    )

    # Bitswan Backend DB
    services["bitswan_backend_db"] = ServiceConfig(
        name=f"aoc-{env_name}-bitswan-backend-postgres",
        url_pattern="bitswan-db.{domain}",
        port=5432,
        env_vars={
            "BITSWAN_BACKEND_POSTGRES_USER": "postgres",
            "BITSWAN_BACKEND_POSTGRES_DB": "bitswan_backend",
            "BITSWAN_BACKEND_POSTGRES_HOST": lambda cfg, svcs: (
                svcs["bitswan_backend_db"].name.format(
                    env_name="local" if cfg.env == Environment.DEV else "production"
                )
                if cfg.dev_setup == DevSetupKind.DOCKER
                else "localhost"
            ),
            "BITSWAN_BACKEND_POSTGRES_PORT": "5432",
            "BITSWAN_BACKEND_POSTGRES_PASSWORD": "postgres",
        },
    )

    # EMQX
    services["emqx"] = ServiceConfig(
        name="aoc-emqx",
        url_pattern="mqtt.{domain}",
        port=1883,
        env_vars={
            "EMQX_MQTT_URL": lambda cfg, svcs: (
                f"mqtt://aoc-{env_name}-emqx:1883"
                if cfg.env == Environment.PROD or cfg.dev_setup == DevSetupKind.DOCKER
                else "mqtt://localhost:1883"
            ),
            "MQTT_URL": "mqtt://aoc-mosquito:1883",
            "NEXT_PUBLIC_MQTT_URL": "{protocol}://mqtt.{domain}/",
            "EMQX_HOST": f"aoc-{env_name}-emqx",
            "EMQX_PORT": "1883",
            "EMQX_USER": "admin",
            "EMQX_AUTHENTICATION__1__MECHANISM": "jwt",
            "EMQX_AUTHENTICATION__1__FROM": "password",
            "EMQX_AUTHENTICATION__1__USE_JWKS": "false",
            "EMQX_AUTHENTICATION__1__ALGORITHM": "hmac-based",
        },
    )

    # AOC
    services["aoc"] = ServiceConfig(
        name="automation-operation-centre",
        url_pattern="aoc.{domain}",
        port=3000,
        env_vars={
            "NEXTAUTH_URL": lambda cfg, svcs: svcs["aoc"].get_url(cfg),
            "AUTH_URL": lambda cfg, svcs: svcs["aoc"].get_url(cfg),
            "KEYCLOAK_POST_LOGOUT_REDIRECT_URI": lambda cfg, svcs: svcs["aoc"].get_url(
                cfg
            ),
            "BITSWAN_BACKEND_API_URL": lambda cfg, svcs: svcs[
                "bitswan_backend"
            ].get_url(cfg, internal=True),
            "NEXT_PUBLIC_BITSWAN_BACKEND_API_URL": lambda cfg, svcs: svcs[
                "bitswan_backend"
            ].get_url(cfg, internal=True),
            "SENTRY_DSN": "",
            "CDS_API_URL": f"http://aoc-{env_name}-cds-api:8080/api",
            "PORTAINER_BASE_URL": f"http://aoc-{env_name}-portainer:9000/",
            "PREPARE_MQTT_SERVICE_URL": "http://container-config-service:8080/trigger",
        },
    )

    # Common/other
    services["redis"] = ServiceConfig(
        name=f"aoc-{env_name}-redis",
        url_pattern="redis.{domain}",
        port=6379,
        env_vars={
            "REDIS_URL": lambda cfg, svcs: svcs["redis"].get_url(cfg, internal=True),
        },
    )

    return services


def get_var_defaults(
    config: "InitConfig", custom_defaults: Optional[Dict[str, str]] = None
) -> Dict[str, str]:
    """
    Get default values for all variables with optional custom overrides

    Args:
        config: Configuration object containing protocol and domain information
        custom_defaults: Optional dictionary of custom override values

    Returns:
        Dictionary containing all default values with any custom overrides applied
    """
    # Create all service configurations
    env_name = "local" if config.env == Environment.DEV else "production"

    services = create_service_configs(env_name, config.env)

    # Initialize empty defaults dict
    defaults = {}

    # Process each service
    for service in services.values():
        # Add service-specific environment variables
        defaults.update(service.get_env_vars(config, services))

    # Apply any custom overrides
    if custom_defaults:
        defaults.update(custom_defaults)

    return defaults
