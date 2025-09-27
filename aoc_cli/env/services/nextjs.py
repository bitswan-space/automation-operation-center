from typing import Dict

from aoc_cli.env.config import Environment, InitConfig
from aoc_cli.env.utils import write_env_files_service


def _public_base_url(config: InitConfig) -> str:
    return f"{config.protocol.value}://aoc.{config.domain}"


def default_env(config: InitConfig) -> Dict[str, str]:
    # React frontend determines backend URL automatically based on hostname
    # No secrets or complex configuration needed
    return {
        "REACT_APP_ENABLE_DEV_TOOLS": "false",
    }


def write_env_files_operations_centre(
    init_config: InitConfig, env_config: Dict[str, str] | None = None
) -> None:
    env_config = env_config or {}
    write_env_files_service(
        service_name="AOC Frontend",
        init_config=init_config,
        env_config=env_config,
        env_vars={
            "React Frontend Configuration": [
                "REACT_APP_ENABLE_DEV_TOOLS",
            ],
        },
    )


