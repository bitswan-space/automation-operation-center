# To setup run

```bash
docker-compose up
```

And then go to https://localhost:9443/ to access and setup portainer

## Getting pumps topology

### Create .env file

Create a .env file in the root of the project with the following content:

```bash
CCS_CONFIG_KEY=<your_ccs_config_key>
PORTAINER_ACCESS_TOKEN=<your_portainer_access_token>
```

### Distribution of Container IDs

Send POST request to container configuration service to distribute container ids to pumps

```bash
POST http://localhost:8080/trigger
Content-Type: application/json

{
    "trigger-key": "<your_ccs_config_key>",
}
```
