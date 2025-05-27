import subprocess

import aiohttp
import sys

from aoc_cli.env.config import Environment, InitConfig


class CaddyService:
    def __init__(self, config: InitConfig):
        self.config = config

    async def add_proxy(self, domain: str, target: str):
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
        await self.caddy_delete_id(domain)
        async with aiohttp.ClientSession() as session:
            async with session.post(gitops_routes_url, json=payload) as response:
                response_text = await response.text()
                print(f"Status: {response.status}")
                print(f"Response: {response_text}")
                print(f"Added route {domain} pointing to {target}")


    async def caddy_delete_id(self, caddy_id):
        while True:
            async with aiohttp.ClientSession() as session:
                resp = await session.delete(f"http://localhost:2019/id/{caddy_id}")
                if resp.status == 404:
                    break
                elif resp.status == 200:
                    print(f"Deleted route with ID {caddy_id}")
                else:
                    raise f"Unknown Caddy API status! {resp.status}, response {resp.text}"

