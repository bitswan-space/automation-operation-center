from typing import Dict

from aoc_cli.env.config import Environment, InitConfig
from aoc_cli.env.utils import write_env_files_service


def _public_base_url(config: InitConfig) -> str:
    return f"{config.protocol.value}://keycloak.{config.domain}"


def _internal_base_url() -> str:
    return "http://aoc-keycloak:8080"


def default_env(config: InitConfig) -> Dict[str, str]:
    keycloak_url = _internal_base_url()
    public_url = _public_base_url(config)
    return {
        "KC_HOSTNAME_URL": public_url,
        "KC_HOSTNAME": public_url,
        "KC_HOSTNAME_ADMIN_URL": public_url,
        "KC_HOSTNAME_ADMIN": public_url,
        "PROXY_ADDRESS_FORWARDING": "true",
        "KC_PROXY": "edge",
        "KC_PROXY_HEADERS": "forwarded",
        "KC_HTTP_ENABLED": "true",
        "KC_HOSTNAME_STRICT": "true",
        "KC_HOSTNAME_STRICT_HTTPS": "false",
        "KC_HEALTH_ENABLED": "true",
        "KC_FEATURES": "preview,token-exchange",
        "KC_BOOTSTRAP_ADMIN_USERNAME": "admin",
        "KEYCLOAK_ADMIN": "admin",
        "KEYCLOAK_CLIENT_ID": "aoc-frontend",
        "KEYCLOAK_REFRESH_URL": f"{_internal_base_url()}/realms/master/protocol/openid-connect/token",
        "KEYCLOAK_ISSUER": f"{_internal_base_url()}/realms/master",
        "KEYCLOAK_END_SESSION_URL": f"{_internal_base_url()}/realms/master/protocol/openid-connect/logout",
        "KEYCLOAK_REALM_NAME": "master",
        "KEYCLOAK_FRONTEND_URL": public_url,
        "KEYCLOAK_ADMIN_URL": public_url,
        "KEYCLOAK_SERVER_URL": _internal_base_url(),
    }


def write_env_files(init_config: InitConfig, env_config: Dict[str, str] | None = None) -> None:
    env_config = env_config or {}
    write_env_files_service(
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
                "KEYCLOAK_ADMIN_PASSWORD",
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


