import subprocess
from pathlib import Path

from aoc_cli.env.config import InitConfig


class IngressService:
    def __init__(self, config: InitConfig):
        self.config = config

    async def add_proxy(self, domain: str, target: str):
        """Add a proxy route using bitswan ingress add-route command."""
        cmd = ["bitswan", "ingress", "add-route", domain, target]
        
        # Add mkcerts flag if enabled
        if self.config.mkcerts:
            cmd.append("--mkcert")
        
        # Add certs-dir if provided
        if self.config.certs_dir:
            cmd.extend(["--certs-dir", self.config.certs_dir])
        
        try:
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                check=True
            )
            print(cmd)
            print(f"Added route {domain} pointing to {target}")
            if result.stdout:
                print(f"Output: {result.stdout}")
        except subprocess.CalledProcessError as e:
            print(f"Failed to add route {domain}: {e.stderr}")
            raise
        except FileNotFoundError:
            print("bitswan command not found. Please ensure bitswan CLI is installed.")
            raise

    def restart(self):
        """Restart is not needed for bitswan ingress as it manages routes dynamically."""
        print("Ingress routes are managed dynamically by bitswan ingress - no restart needed")
        return True
