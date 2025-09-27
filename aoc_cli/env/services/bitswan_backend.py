from typing import Dict

from aoc_cli.env.config import Environment, InitConfig
from aoc_cli.env.utils import write_env_files_service


def default_env(config: InitConfig) -> Dict[str, str]:
    return {
        "DJANGO_SETTINGS_MODULE": "config.settings.production",
        "DJANGO_ADMIN_URL": "admin/",
        "DJANGO_ALLOWED_HOSTS": "api.{domain},aoc-bitswan-backend".format(
            domain=config.domain
        ),
        "DJANGO_SECURE_SSL_REDIRECT": "False",
        "DJANGO_SERVER_EMAIL": "",
        "DJANGO_ACCOUNT_ALLOW_REGISTRATION": "True",
        "BITSWAN_BACKEND_KEYCLOAK_CLIENT_ID": "bitswan-backend",
        "CORS_ALLOWED_ORIGINS": f"{config.protocol.value}://aoc.{config.domain}",
        "FRONTEND_URL": f"{config.protocol.value}://aoc.{config.domain}",
        "EMQX_EXTERNAL_URL": f"mqtt.{config.domain}:443",
        "EMQX_INTERNAL_URL": "aoc-emqx:1883",
        "WEB_CONCURRENCY": "4",
        "SENTRY_TRACES_SAMPLE_RATE": "1.0",
        "USE_DOCKER": "yes",
        "DJANGO_READ_DOT_ENV_FILE": "False",
        # Image version metadata (populated from resolved images)
        "BITSWAN_BACKEND_IMAGE": config.aoc_be_image,
        "AOC_IMAGE": config.aoc_image,
        "PROFILE_MANAGER_IMAGE": config.profile_manager_image,
        "KEYCLOAK_IMAGE": config.keycloak_image,
    }


def write_env_files(init_config: InitConfig, env_config: Dict[str, str] | None = None) -> None:
    env_config = env_config or {}

    POSTGRES_USER = env_config.get("BITSWAN_BACKEND_POSTGRES_USER")
    POSTGRES_HOST = env_config.get("BITSWAN_BACKEND_POSTGRES_HOST")
    POSTGRES_PORT = env_config.get("BITSWAN_BACKEND_POSTGRES_PORT")
    POSTGRES_PASSWORD = env_config.get("BITSWAN_BACKEND_POSTGRES_PASSWORD")
    POSTGRES_DB = env_config.get("BITSWAN_BACKEND_POSTGRES_DB")

    DATABASE_URL = f"postgres://{POSTGRES_USER}:{POSTGRES_PASSWORD}@{POSTGRES_HOST}:{POSTGRES_PORT}/{POSTGRES_DB}"

    write_env_files_service(
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
                "KEYCLOAK_FRONTEND_URL",
                ("KEYCLOAK_CLIENT_ID", "bitswan-backend"),
                ("KEYCLOAK_REALM_NAME", "master"),
                "KEYCLOAK_GLOBAL_SUPERADMIN_GROUP_ID",
                "AUTH_SECRET_KEY",
                "CORS_ALLOWED_ORIGINS",
                "FRONTEND_URL",
                "USE_DOCKER",
                "DJANGO_READ_DOT_ENV_FILE",
                "EMQX_EXTERNAL_URL",
                "EMQX_INTERNAL_URL",
                ("EMQX_JWT_SECRET", env_config.get("EMQX_AUTHENTICATION__1__SECRET")),
                ("DATABASE_URL", DATABASE_URL),
                # Image version metadata (written alongside other config)
                "BITSWAN_BACKEND_IMAGE",
                "AOC_IMAGE",
                "PROFILE_MANAGER_IMAGE",
                "KEYCLOAK_IMAGE",
            ]
        },
    )


