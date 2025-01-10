from pathlib import Path
from typing import Dict

from aoc_cli.config.services import ServiceConfig


def write_env_file(env_vars: Dict[str, str], service: ServiceConfig) -> None:
    """Write environment variables to a file, mapping variables if needed"""
    env_file = Path(service.env_file_path)

    with open(env_file, "w") as f:
        for key in sorted(service.env_vars):
            if key not in env_vars:
                continue

            value = env_vars[key]
            # If this service has variable mapping, use the mapped name
            if service.variable_mapping and key in service.variable_mapping:
                docker_key = service.variable_mapping[key]
            else:
                docker_key = key

            f.write(f"{docker_key}={value}\n")
            f.write(f"{docker_key}={value}\n")
