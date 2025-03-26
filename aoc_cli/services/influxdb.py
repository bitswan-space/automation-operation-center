import subprocess
import time
from dataclasses import dataclass
from pathlib import Path

import click
import requests
from influxdb_client import InfluxDBClient

from aoc_cli.env.config import (
    INFLUXDB_ENV_FILE,
    OPERATIONS_CENTRE_DOCKER_ENV_FILE,
    OPERATIONS_CENTRE_LOCAL_ENV_FILE,
    DevSetupKind,
    InitConfig,
)
from aoc_cli.env.utils import get_env_path
from aoc_cli.utils.env import get_env_value
from aoc_cli.utils.tools import get_aoc_working_directory


@dataclass
class InfluxDBConfig:
    username: str
    password: str
    org: str
    bucket: str
    aoc_dir: Path
    url: str = "http://localhost:8086"
    token_name: str = "aoc-token"
    token_description: str = "Token for AOC services"


class InfluxDBService:
    def __init__(self, config: InitConfig):
        """Initialize InfluxDB service"""
        influx_db_env_path = get_env_path(config.env, INFLUXDB_ENV_FILE)
        config_params = InfluxDBConfig(
            username=get_env_value(
                influx_db_env_path,
                "DOCKER_INFLUXDB_INIT_USERNAME",
            ),
            password=get_env_value(
                influx_db_env_path,
                "DOCKER_INFLUXDB_INIT_PASSWORD",
            ),
            org=get_env_value(
                influx_db_env_path,
                "DOCKER_INFLUXDB_INIT_ORG",
            ),
            bucket=get_env_value(
                influx_db_env_path,
                "DOCKER_INFLUXDB_INIT_BUCKET",
            ),
            aoc_dir=config.aoc_dir,
            url="http://localhost:8086",
            token_name="aoc-token",
            token_description="Token for AOC services",
        )

        self.init_config = config
        self.config = config_params
        self.client = None

    def setup(self) -> dict:
        """Main setup function that orchestrates the InfluxDB initialization"""
        self.start()
        self.wait_for_service()

        influxdb_token = self.create_token()
        self._update_envs_with_influxdb_token(influxdb_token["token"])

        self.cleanup()
        click.echo("✓ InfluxDB setup complete")

    def start(self) -> None:
        """Start the InfluxDB service using docker-compose"""
        click.echo("Starting InfluxDB service...")
        cwd = get_aoc_working_directory(self.init_config.env, self.init_config.aoc_dir)
        subprocess.run(
            [
                "docker",
                "compose",
                "-f",
                f"docker-compose.{self.init_config.env.value}.yml",
                "up",
                "-d",
                "influxdb",
            ],
            cwd=cwd,
            check=True,
            stdout=subprocess.DEVNULL,
        )

    def wait_for_service(self, max_retries: int = 30, delay: int = 10) -> None:
        """Wait for InfluxDB to be ready"""
        click.echo("Waiting for InfluxDB to be ready...")
        for attempt in range(max_retries):
            try:
                response = requests.get(f"{self.config.url}/health")
                if response.status_code == 200:
                    click.echo("InfluxDB is ready")
                    return
            except requests.RequestException:
                if attempt < max_retries - 1:
                    time.sleep(delay)
                else:
                    raise TimeoutError("InfluxDB failed to start")

    def connect(self) -> None:
        """Connect to InfluxDB using setup token"""
        click.echo("Connecting to InfluxDB...")

        self.client = InfluxDBClient(
            url=self.config.url,
            org=self.config.org,
            username=self.config.username,
            password=self.config.password,
        )

        click.echo("Connected to InfluxDB")

    def create_token(self) -> dict:
        """Create a new token for AOC services"""
        self.connect()
        auth_api = self.client.authorizations_api()

        tokens = auth_api.find_authorizations()

        for token in tokens:
            if token.description == self.config.token_description:
                print("Token already exists")
                return {"token": token.token, "id": token.id, "status": "existing"}

        permissions = [
            {
                "action": "read",
                "resource": {"type": "buckets"},
            },
        ]

        auth = auth_api.create_authorization(
            org_id=self.client.org, permissions=permissions, authorization=tokens[0]
        )

        return {"token": auth.token, "id": auth.id, "status": "created"}

    def cleanup(self) -> None:
        """Cleanup resources"""
        if self.client:
            self.client.close()

    def _update_envs_with_influxdb_token(self, secret: str) -> None:
        aoc_env_file = (
            OPERATIONS_CENTRE_DOCKER_ENV_FILE
            if self.init_config.dev_setup == DevSetupKind.DOCKER
            else OPERATIONS_CENTRE_LOCAL_ENV_FILE
        )

        file_path = get_env_path(
            self.init_config.env,
            aoc_env_file,
            self.init_config.dev_setup.value,
            "aoc",
        )

        click.echo(f"Updating {file_path}")

        with open(file_path, "a") as f:
            f.write(f"\nINFLUXDB_TOKEN={secret}\n")
            self.init_config.dev_setup.value,
            "aoc",
