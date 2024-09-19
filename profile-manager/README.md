# Bitswan Profile Manager
Service which is listening on MQTT topics of CDS agents and merge the topologies to one topology of all running pipelines. The service is also managing dynamic navigation menu in POC using attached JSON file.

TODO: Can also be used to create configurable "profiles" which only include certain pipelines/automations and sidebar items. This is bitswan AOC's main access controll mechanism.

## Dependencies
- MQTT Broker (Mosquitto)
- JSON Schema for navigation file
- JSON navigation file

## Config example
- Navigation file example is stored [here](https://gitlab.com/LibertyAces/Product/container-discovery-service/-/blob/dev/conf/navigation_menu_example.json?ref_type=heads)
- Navigation file schema is stored [here](https://gitlab.com/LibertyAces/Product/container-discovery-service/-/blob/dev/conf/navigation_menu_schema_template.json?ref_type=heads)
### Service config
```yaml
mqtt-broker-url: mqtt://localhost:1883
mqtt-containers-pub: /c/running-pipelines/topology
mqtt-topology-topics: ["topology1", "topology2"]
mqtt-navigation-topic: /topology
mqtt-navigation-set: /topology/set
navigation-file: /conf/navigation_menu.json
navigation-schema-file: /conf/navigation_schema.json
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
      - ./navigation_menu.json:/conf/navigation_menu.json
      - ./navigation_schema.json:/conf/navigation_schema.json
```
