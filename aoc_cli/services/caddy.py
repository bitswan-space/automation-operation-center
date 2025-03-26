import subprocess

import aiohttp

from aoc_cli.env.config import Environment, InitConfig


async def caddy_delete_id(caddy_id):
    while True:
        async with aiohttp.ClientSession() as session:
            resp = await session.delete(f"http://localhost:2019/id/{caddy_id}")
            if resp.status == 404:
                break
            elif resp.status == 200:
                print(f"Deleted route with ID {caddy_id}")
            else:
                raise f"Unknown Caddy API status! {resp.status}, response {resp.text}"


class CaddyService:
    def __init__(self, config: InitConfig):
        self.config = config
        self.outsourced = (
            False  # gets set to true in initialize when caddy admin is found
        )
        self.caddyfile_path = None

    async def add_proxy(self, domain: str, target: str):
        if not self.outsourced:
            config = f"""
                {domain} {{
                    reverse_proxy {target}
                }}
            """

            with open(self.caddyfile_path, "a") as f:
                f.write(config)
        else:
            gitops_routes_url = (
                "http://localhost:2019/config/apps/http/servers/srv0/routes"
            )
            payload = {
                "@id": domain,
                "match": [{"host": [domain]}],
                "handle": [
                    {
                        "handler": "subroute",
                        "routes": [
                            {
                                "handle": [
                                    {
                                        "handler": "reverse_proxy",
                                        "upstreams": [{"dial": target}],
                                    }
                                ]
                            }
                        ],
                    }
                ],
                "terminal": True,
            }
            await caddy_delete_id(domain)
            async with aiohttp.ClientSession() as session:
                async with session.post(gitops_routes_url, json=payload) as response:
                    response_text = await response.text()
                    print(f"Status: {response.status}")
                    print(f"Response: {response_text}")
                    print(f"Added route {domain} pointing to {target}")

    async def initialize(self) -> None:
        async with aiohttp.ClientSession() as session:
            try:
                resp = await (
                    await session.get("http://localhost:2019/config", timeout=2)
                ).json()
                self.outsourced = bool(resp["admin"].get("listen"))
                print("Caddy with admin at port 2019 running. Using that instead")
            except:
                self.outsourced = False

        if not self.outsourced:
            self.caddyfile_path = self.config.aoc_dir / "Caddyfile"
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
        else:
            pass

    def start(self) -> None:
        if not self.outsourced:
            subprocess.run(
                ["docker", "compose", "up", "-d", "caddy"],
                cwd=self.config.aoc_dir,
                check=True,
            )
