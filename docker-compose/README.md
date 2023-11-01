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

### Get pipeline topology
- Subscribe to `c/{container_id}/c/{pipeline_id}/topology`
- Publish message below to `c/{container_id}/c/{pipeline_id}/topology/get`
```json
{
    "method": "get"
}
```
- Topology structure
```json
{
    "topology": {
        "RandomNumberSource": {
            "wires": [
                "ExampleProcessor"
            ],
            "properties": {},
            "capabilities": ["subscribable-events"],
            "metrics": {
                "eps.out": 0
            }
        },
        "ExampleProcessor": {
            "wires": [
                "FileCSVSink"
            ],
            "properties": {},
            "capabilities": ["subscribable-events"],
            "metrics": {
                "eps.in": 0,
                "eps.out": 0
            }
        },
        "FileCSVSink": {
            "wires": [],
            "properties": {},
            "capabilities": ["subscribable-events"],
            "metrics": {
                "eps.in": 0,
                "eps.out": 0
            }
        }
    },
    "display-style": "graph",
    "display-priority": "shown"
}
```



### Get pump topology 
- Subscribe to `c/{container_id}/topology`
- Publish message below to `c/{container_id}/topology/get` topic
```json
{
    "method": "get"
}
```
- Topology structure
```json
{
    "topology": {
        "ExamplePipeline": {
            "wires": [],
            "properties": [],
            "capabilities": ["has-children"],
            "metrics": []
        }
    },
    "display-style": "graph",
    "display-priority": "hidden"
}
```

## Getting events from components
Assuming you have already set up the container id in the pumps, you can get the events from components by subscribing to this MQTT topic
```
c/{container_id}/c/{pipeline_id}/c/{component_id}/events
```

When you want to get events you send this JSON specifing how many events you want to get
```json
{
    "event_count": <value>
}
```
and send this JSON to this MQTT topic
```
c/{container_id}/c/{pipeline_id}/c/{component_id}/events/subscribe
```
The JSON structure from the output will looks like this
```json
{
    "timestamp": 1696516600329994262,
    "data": {
        "timestamp": "2023-10-05 14:36:40.289688",
        "random_number": 60,
        "squared": 3600,
        "doubled": 120
    },
    "event_number": 14292
}
```
