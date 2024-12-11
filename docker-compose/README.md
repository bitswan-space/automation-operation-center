# Platform

This repo combines the [Pipeline Operations Centre](https://github.com/bitswan-space/Bitswan-Pipeline-Operations-Centre) with all its dependencies in a single `docker-compose.yml`. Apart from the POC, the services used are

- influxdb: real time-capable database that receives pipeline events for monitoring
- keycloak: OpenID authentication service for POC
- postgres, mailhog: Dependencies of keycloak
- mosquitto: MQTT service that sources data for pipelines

## Setup

Before running, you need to generate the environment variables. Run

```bash
bash setup.sh
```

and input the endpoints for the POC and keycloak instances.

Note that the given keycloak endpoint must be accessible to the POC from both the client and in-container server sides. The name `localhost` will be different in both of these contexts and won't work for local testing. You can get around this by setting up a local domain name like `platform.local` which points to the host machine's `localhost` by e.g. adding the following to `/etc/hosts`

```bash
127.0.0.1 platform.local
127.0.0.1 keycloak.platform.local
127.0.0.1 poc.platform.local
127.0.0.1 influx.platform.local
```

Caddy is used to forward requests to `keycloak.platform.local` from the browser to `keycloak:8080`. If you are using a different domain than `platform.local`, set the `DOMAIN` environment variable to it in `docker-compose.yml` under `caddy`, as well as changing the `Caddyfile`.

Next, run the containers

```bash
docker-compose up -d
```

and then go to <https://localhost:9443/> to access and setup portainer. Before the POC is operational, you still need to manually get these tokens and add them to environment files:

|||
|--|--|
|KEYCLOAK_CLIENT_SECRET|[Instructions for getting this value here](https://stackoverflow.com/questions/75647456/post-call-to-keycloak-to-fetch-access-token-works-in-postman-but-not-from-axios)|
|INFLUXDB_TOKEN|This can be obtained by going to the influxdb UI and going to data -> tokens -> generate"|
|PORTAINER_ACCESS_TOKEN|This can be obtained by logging into the portainer UI, clicking on the username in the top right, then My account, then + add access token|
