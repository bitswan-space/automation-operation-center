from typing import Dict

from aoc_cli.env.config import Environment, InitConfig
from aoc_cli.env.utils import bootstrap_service


def _internal_url() -> str:
    return "http://aoc-influxdb:8086/"


def default_env(config: InitConfig) -> Dict[str, str]:
    return {
        "INFLUXDB_URL": _internal_url(),
        "INFLUXDB_ORG": "pipeline-operations-centre",
        "DOCKER_INFLUXDB_INIT_ORG": "pipeline-operations-centre",
        "INFLUXDB_BUCKET": "pipeline-metrics",
        "DOCKER_INFLUXDB_INIT_BUCKET": "pipeline-metrics",
        "INFLUXDB_USERNAME": "pipeline-operations-centre",
        "DOCKER_INFLUXDB_INIT_USERNAME": "pipeline-operations-centre",
    }


def bootstrap(init_config: InitConfig, env_config: Dict[str, str] | None = None) -> None:
    env_config = env_config or {}
    bootstrap_service(
        service_name="InfluxDB",
        init_config=init_config,
        env_config=env_config,
        env_vars={
            "Influxdb Service Configuration": [
                "DOCKER_INFLUXDB_INIT_ORG",
                "DOCKER_INFLUXDB_INIT_BUCKET",
                "DOCKER_INFLUXDB_INIT_USERNAME",
                "DOCKER_INFLUXDB_INIT_PASSWORD",
            ]
        },
    )


