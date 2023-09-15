To setup run

```
docker-compose up
```

And then go to https://localhost:9443/ to access and setup portainer

## Getting pumps topology
### Create .env file
Create a .env file in the root of the project with the following content:

```
CCS_CONFIG_KEY=<your_ccs_config_key>
PORTAINER_ACCESS_TOKEN=<your_portainer_access_token>
```

### Distribution of Container IDs
Send POST request to container configuration service to distribute container ids to pumps
```http request
POST http://localhost:8080/trigger
Content-Type: application/json

{
    "trigger-key": "<your_ccs_config_key>",
}
```

### Subscribe to mqtt topic related to pump
1. Exec to mosquitto container
```shell script
docker exec -it mosquitto /bin/sh
```
2. Subscribe to topic
```shell script
mosquitto_sub -h mosquitto -t "{container_id_of_pump}/Metrics"
```

### Publish get message to generate topology
1. Exec to mosquitto container
```shell script
docker exec -it mosquitto /bin/sh
```
2. Publish get message
```shell script
mosquitto_pub -h mosquitto -t "{container_id_of_pump}/Metrics/get" -m "get"
```

