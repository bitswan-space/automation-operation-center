from pathlib import Path

import yaml


# TODO: Use api for config
class TraefikConfigurator:
    _instance = None

    def __new__(cls, traefik_config_path):
        if not cls._instance:
            cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self, config_path):
        self.config_path = config_path

    def load_config(self):
        """Load the current YAML configuration from a file."""
        with Path.open(self.config_path) as file:
            return yaml.safe_load(file)

    def save_config(self, config):
        """Save the updated configuration to the YAML file."""
        with Path.open(self.config_path, "w") as file:
            yaml.safe_dump(config, file)

    def add_route(self, route_name, rule, middleware=None, service_url=None):
        """Add a new route to the configuration file and update Traefik via API."""
        config = self.load_config()

        if "http" not in config:
            config["http"] = {}
        if "routers" not in config["http"]:
            config["http"]["routers"] = {}
        if "services" not in config["http"]:
            config["http"]["services"] = {}

        config["http"]["routers"][route_name] = {
            "rule": rule,
            "service": route_name,
            "middlewares": [middleware] if middleware else [],
            "entryPoints": ["web"],
        }

        config["http"]["services"][route_name] = {
            # Define your service here. This is an example placeholder.
            "loadBalancer": {
                "servers": [{"url": service_url}],
            },
        }

        self.save_config(config)

    def add_middleware(self, middleware_name, middleware_details):
        """Add or update middleware in the configuration file."""
        config = self.load_config()

        if "http" not in config:
            config["http"] = {}
        if "middlewares" not in config["http"]:
            config["http"]["middlewares"] = {}

        config["http"]["middlewares"][middleware_name] = middleware_details

        self.save_config(config)
