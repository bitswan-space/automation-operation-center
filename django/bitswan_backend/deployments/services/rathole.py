import socket
from pathlib import Path

import toml

from bitswan_backend.deployments.utils import get_port_from_url


class RatholeConfigurator:
    _instance = None

    def __new__(cls, rathole_config_path):
        if not cls._instance:
            cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self, rathole_config_path):
        self.rathole_config_path = rathole_config_path

    def load_rathole_config(self):
        """Load the current Rathole TOML configuration from a file."""
        with Path.open(self.rathole_config_path) as file:
            return toml.load(file)

    def save_rathole_config(self, config):
        """Save the updated Rathole configuration to the TOML file."""
        with Path.open(self.rathole_config_path, "w") as file:
            toml.dump(config, file)

    def add_rathole_service(self, service_name, token):
        """Add a new service to the Rathole configuration file."""
        config = self.load_rathole_config()

        if "server" not in config:
            config["server"] = {}

        if "services" not in config["server"]:
            config["server"]["services"] = {}

        free_port = self.get_free_port()

        bind_addr = f"0.0.0.0:{free_port}"
        config["server"]["services"][service_name] = {
            "token": token,
            "bind_addr": bind_addr,
            # Add additional service configuration as needed
        }

        self.save_rathole_config(config)

        return {"service_url": bind_addr, "port": free_port}

    def get_free_port(self):
        """Get a free port between 10000 and 19999."""
        addresses = []
        config = self.load_rathole_config()

        if "server" in config and "services" in config["server"]:
            for service in config["server"]["services"].values():
                bind_addr = service.get("bind_addr")
                if bind_addr:
                    port = get_port_from_url(bind_addr)
                    addresses.append(int(port))

        for port in range(10000, 20000):
            if port not in addresses and not self.is_port_in_use(port):
                return port

        return None

    def is_port_in_use(self, port):
        """Check if a port is already in use."""
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            # TODO: Add host to config
            return s.connect_ex(("bitswan_backend_local_rathole", port)) == 0
