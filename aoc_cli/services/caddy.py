import subprocess

from aoc_cli.config import Environment, InitConfig


class CaddyService:
    def __init__(self, config: InitConfig):
        self.config = config
        self.caddyfile_path = config.aoc_dir / "Caddyfile"

    def add_proxy(self, domain: str, target: str):
        self._update_caddyfile(domain, target)

    def _update_caddyfile(self, domain: str, target: str):
        config = f"""
            {domain} {{
                reverse_proxy {target}
            }}
        """

        with open(self.caddyfile_path, "a") as f:
            f.write(config)

    def initialize(self) -> None:
        directories = [
            self.config.aoc_dir / "caddy_data",
            self.config.aoc_dir / "caddy_config",
        ]

        try:
            for directory in directories:
                directory.mkdir(parents=True, exist_ok=True)
                print(f"Created directory: {directory}")

            caddyfile_content = """
                {
                    auto_https off
                }"""

            if self.config.env == Environment.PROD:
                # Production environment
                caddyfile_content = f"""
                {{
                    email {self.config.admin_email}
                }}
                """

            caddyfile_path = self.config.aoc_dir / "Caddyfile"
            with open(caddyfile_path, "w", encoding="utf-8") as f:
                f.write(caddyfile_content)
            print(f"Created Caddyfile: {caddyfile_path}")

        except OSError as e:
            raise OSError(f"Failed to set up Caddy service: {str(e)}")

    def start(self) -> None:
        subprocess.run(
            ["docker-compose", "up", "-d", "caddy"],
            cwd=self.config.aoc_dir,
            check=True,
        )
