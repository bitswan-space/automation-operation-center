# Container Discovery Service
Service which is listening on MQTT topics, and on `get` method returns topology of containers from Portainer API.

## Dependencies
- Portainer
- MQTT Broker (Mosquitto)
- Portainer access token

## Config example
### Service config
```yaml
portainer-url: http://portainer-url
mqtt-broker-host: localhost
mqtt-broker-port: 1883
mqtt-topology-topic-pub: topology
mqtt-topology-topic-sub: topology/get
```
### Docker-compose
```yaml
  container-discovery-service:
    restart: always
    image: <image_url>
    env_file:
      - .discovery_service.env
    volumes:
      - ./discover_service.yaml:/conf/config.yaml:r
```