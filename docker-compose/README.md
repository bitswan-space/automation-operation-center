# To setup run

```bash
docker-compose up -d
```

And then go to https://localhost:9443/ to access and setup portainer

## Setup environment variables
Run to generate necessary environment variables

```bash
bash setup.sh
```

You have to manually get these tokens and add them to environment files:
1. Portainer access token
2. Client secret from Keycloak
3. Access token from InfluxDB