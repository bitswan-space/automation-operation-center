from typing import Dict

from aoc_cli.env.config import InitConfig
from aoc_cli.env.utils import write_env_files_service


def default_env(config: InitConfig) -> Dict[str, str]:
    return {
        "MQTT_BROKER_URL": "mqtt://aoc-emqx:1883",
    }


def write_env_files(init_config: InitConfig, env_config: Dict[str, str] | None = None) -> None:
    env_config = env_config or {}
    write_env_files_service(
        service_name="Profile Manager",
        init_config=init_config,
        env_config=env_config,
        env_vars={
            "Profile Manager": [
                ("MQTT_BROKER_URL", "mqtt://aoc-emqx:1883"),
                ("MQTT_BROKER_SECRET", env_config.get("EMQX_AUTHENTICATION__1__SECRET")),
            ]
        },
    )


