import logging
import secrets
import string

from django.conf import settings

from apps.gitops.api.services.docker import DockerService
from apps.gitops.api.services.rathole import RatholeConfigurator
from apps.gitops.api.services.traefik import TraefikConfigurator

logger = logging.getLogger(__name__)


class PipelineEditorConfigurator:
    _instance = None

    def __new__(cls, rathole_config_path, traefik_config_path):
        if not cls._instance:
            cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self, rathole_config_path="", traefik_config_path=""):
        self.rathole_configurator = RatholeConfigurator(rathole_config_path)
        self.traefik_configurator = TraefikConfigurator(traefik_config_path)
        self.docker_service = DockerService()

    def setup_rathole_service(self, service_name, token):
        """Add a new service to Rathole's configuration."""
        service_config = self.rathole_configurator.add_rathole_service(
            service_name,
            token,
        )
        logger.info("Added '%s' to Rathole configuration.", service_name)

        return service_config

    def setup_traefik_route(self, route_name, rule, middleware, service_url):
        """Add a new route to Traefik's configuration."""
        self.traefik_configurator.add_route(route_name, rule, middleware, service_url)
        logger.info("Added '%s' route to Traefik configuration.", route_name)

    def restart_services(self):
        """Restart Rathole and Traefik Docker containers to apply changes."""

        traefik_container_name = "bitswan_backend_local_traefik"
        rathole_container_name = "bitswan_backend_local_rathole"

        containers = [traefik_container_name, rathole_container_name]

        for container in containers:
            if self.docker_service.restart_container(container):
                logger.info("Container '%s' restarted successfully.", container)

    def initialise_pipeline_ide_deployment(
        self,
        token,
        deployment_id,
        company_slug,
        middleware=None,
    ):
        """Initialise a new deployment for the pipeline IDE."""

        # Generate a random service name suffix to avoid conflicts
        res = "".join(secrets.choice(string.ascii_letters) for _ in range(30))

        service_name = f"{deployment_id}-{company_slug}-{res}"
        service_config = self.setup_rathole_service(service_name, token)

        host = f"{deployment_id}.{company_slug}.{settings.GITOPS_IDE_HOST}"

        traefik_rule = f"Host(`{host}`)"

        route_name = f"{service_name}-route"
        self.setup_traefik_route(
            route_name,
            traefik_rule,
            middleware,
            service_config["service_url"],
        )

        # TODO: Add redirect uri to keycloak client

        # TODO: This is a temporary solution i.e. file watcher
        self.restart_services()
