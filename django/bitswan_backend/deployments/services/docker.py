import logging

import docker

logger = logging.getLogger(__name__)


class DockerService:
    _instance = None

    def __new__(cls):
        if not cls._instance:
            cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self):
        self.client = docker.from_env()

    def restart_container(self, container_name):
        """Restart a container by its name."""
        try:
            container = self.client.containers.get(container_name)
            container.restart()
        except docker.errors.NotFound:
            logger.exception("Container '%s' not found.", container_name)
            return False
        except docker.errors.APIError:
            logger.exception("Failed to restart container '%s'.", container_name)
            return False
        else:
            return True
