from typing import Dict

from aoc_cli.env.config import Environment, InitConfig
from aoc_cli.env.utils import bootstrap_service


def default_env(config: InitConfig) -> Dict[str, str]:
    mqtt_url = (
        f"wss://mqtt.{config.domain}/mqtt"
        if config.env == Environment.PROD
        else "ws://localhost:8083/mqtt"
    )
    return {
        "EMQX_MQTT_URL": mqtt_url,
        "EMQX_HOST": "aoc-emqx",
        "EMQX_PORT": "1883",
        "EMQX_USER": "admin",
        "EMQX_AUTHENTICATION__1__MECHANISM": "jwt",
        "EMQX_AUTHENTICATION__1__FROM": "password",
        "EMQX_AUTHENTICATION__1__USE_JWKS": "false",
        "EMQX_AUTHENTICATION__1__ALGORITHM": "hmac-based",
    }


def bootstrap(init_config: InitConfig, env_config: Dict[str, str] | None = None) -> None:
    env_config = env_config or {}
    bootstrap_service(
        service_name="EMQX",
        init_config=init_config,
        env_config=env_config,
        env_vars={
            "EMQX": [
                "EMQX_HOST",
                "EMQX_PORT",
                "EMQX_USER",
                "EMQX_DASHBOARD__DEFAULT_PASSWORD",
            ],
            "JWT Authentication": [
                "EMQX_AUTHENTICATION__1__SECRET",
                "EMQX_AUTHENTICATION__1__MECHANISM",
                "EMQX_AUTHENTICATION__1__FROM",
                "EMQX_AUTHENTICATION__1__USE_JWKS",
                "EMQX_AUTHENTICATION__1__ALGORITHM",
            ],
        },
    )


