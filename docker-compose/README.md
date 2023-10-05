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

### Getting the KEYCLOAK secrets:

https://stackoverflow.com/questions/75647456/post-call-to-keycloak-to-fetch-access-token-works-in-postman-but-not-from-axios

### Distribution of Container IDs

Send POST request to container configuration service to distribute container ids to pumps

```bash
POST http://localhost:8080/trigger
Content-Type: application/json

{
    "trigger-key": "<your_ccs_config_key>",
}
```

### Subscribe to mqtt topic related to pump

1. Exec to mosquitto container

    ```bash
    docker exec -it mosquitto /bin/sh
    ```

2. Subscribe to topic

    ```bash
    mosquitto_sub -h mosquitto -t "{container_id_of_pump}/Metrics"
    ```

### Publish get message to generate topology

1. Exec to mosquitto container

    ```bash
    docker exec -it mosquitto /bin/sh
    ```

2. Publish get message

    ```bash
    mosquitto_pub -h mosquitto -t "{container_id_of_pump}/Metrics/get" -m "get"
    ```
