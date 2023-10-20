# Container Discovery Service
Service which is listening on MQTT topics, and on `get` message returns topology of container from Portainer API. Service can also distribute the container_ids over containers.

## Dependencies
- Portainer
- MQTT Broker (Mosquitto)
- Container configuration token
- Portainer access token

## Config example
### Service config
```yaml
portainer-url: http://portainer-url
mqtt-broker-host: localhost
mqtt-broker-port: 1883
```
### Docker-compose
```yaml
container-discovery-service:
    image: url-of-image
    restart: always
    volume:
        - ./container-discovery-service/config.yaml:/app/config.yaml
```