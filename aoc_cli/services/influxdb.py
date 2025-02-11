import subprocess
import time
from dataclasses import dataclass
from pathlib import Path

import requests
from influxdb_client import InfluxDBClient

from aoc_cli.config import InitConfig
from aoc_cli.config.services import INFLUXDB_ENV_FILE, OPERATIONS_CENTRE_ENV_FILE
from aoc_cli.utils.env import get_env_value


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

        config_params = InfluxDBConfig(
            username=get_env_value(
                config.aoc_dir / "envs" / INFLUXDB_ENV_FILE,
                "DOCKER_INFLUXDB_INIT_USERNAME",
            ),
            password=get_env_value(
                config.aoc_dir / "envs" / INFLUXDB_ENV_FILE,
                "DOCKER_INFLUXDB_INIT_PASSWORD",
            ),
            org=get_env_value(
                config.aoc_dir / "envs" / INFLUXDB_ENV_FILE,
                "DOCKER_INFLUXDB_INIT_ORG",
            ),
            bucket=get_env_value(
                config.aoc_dir / "envs" / INFLUXDB_ENV_FILE,
                "DOCKER_INFLUXDB_INIT_BUCKET",
            ),
            aoc_dir=config.aoc_dir,
            url="http://localhost:8086",
            token_name="aoc-token",
            token_description="Token for AOC services",
        )

        self.config = config_params
        self.client = None

    def setup(self) -> dict:
        """Main setup function that orchestrates the InfluxDB initialization"""
        self.start()
        self.wait_for_service()

        influxdb_token = self.create_token()
        self._update_envs_with_influxdb_token(influxdb_token["token"])

        self.cleanup()

    def start(self) -> None:
        """Start the InfluxDB service using docker-compose"""
        print("Starting InfluxDB service...")
        subprocess.run(
            ["docker-compose", "up", "--quiet-pull", "-d", "influxdb"],
            cwd=self.config.aoc_dir,
            check=True,
        )

    def wait_for_service(self, max_retries: int = 30, delay: int = 10) -> None:
        """Wait for InfluxDB to be ready"""
        print("Waiting for InfluxDB to be ready...")
        for attempt in range(max_retries):
            try:
                response = requests.get(f"{self.config.url}/health")
                if response.status_code == 200:
                    print("InfluxDB is ready")
                    return
            except requests.RequestException:
                if attempt < max_retries - 1:
                    print(
                        f"Attempt {attempt + 1}/{max_retries} - InfluxDB not ready yet"
                    )
                    time.sleep(delay)
                else:
                    raise TimeoutError("InfluxDB failed to start")

    def connect(self) -> None:
        """Connect to InfluxDB using setup token"""
        print("Connecting to InfluxDB...")

        self.client = InfluxDBClient(
            url=self.config.url,
            org=self.config.org,
            username=self.config.username,
            password=self.config.password,
        )

        print("Connected to InfluxDB")

    def create_token(self) -> dict:
        """Create a new token for AOC services"""
        self.connect()
        print("Checking if token already exists")

        auth_api = self.client.authorizations_api()

        tokens = auth_api.find_authorizations()
        print("Found tokens:", tokens)

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
        print("Creating new token")
        auth = auth_api.create_authorization(
            org_id=self.client.org, permissions=permissions, authorization=tokens[0]
        )

        print("Token created")
        return {"token": auth.token, "id": auth.id, "status": "created"}

    def cleanup(self) -> None:
        """Cleanup resources"""
        if self.client:
            self.client.close()

    def _update_envs_with_influxdb_token(self, secret: str) -> None:
        file_path = self.config.aoc_dir / "envs" / OPERATIONS_CENTRE_ENV_FILE
        with open(file_path, "a") as f:
            f.write(f"INFLUXDB_TOKEN={secret}\n")
