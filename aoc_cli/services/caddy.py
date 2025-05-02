import subprocess

import aiohttp

from aoc_cli.env.config import InitConfig


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
        gitops_routes_url = (
            "http://localhost:2019/config/apps/http/servers/srv0/routes"
        )
        payload = {
            "@id": domain.split("://")[1],
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
                if response.status != 200:
                    print(f"Failed to add route {domain} pointing to {target}")

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
            # Call bitswan caddy init command
            try:
                subprocess.run(
                    ["bitswan", "caddy", "init"],
                    cwd=self.config.aoc_dir,
                    check=True,
                )
            except subprocess.CalledProcessError as e:
                raise Exception(f"Failed to initialize Caddy: {e}")

        else:
            pass
