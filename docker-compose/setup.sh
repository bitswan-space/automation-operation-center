#!/bin/sh

# if docker.env does not exist create it from the template
if [ ! -f .env ]; then
    cp .env.template .env
    POSTGRES_PASSWORD=$(mcookie)
    echo POSTGRES_PASSWORD=$POSTGRES_PASSWORD >> .env
    echo KC_DB_PASSWORD=$POSTGRES_PASSWORD >> .env
    INFLUXDB_PASSWORD=$(mcookie)
    echo INFLUXDB_PASSWORD=$INFLUXDB_PASSWORD >> .env
    echo DOCKER_INFLUXDB_INIT_PASSWORD=$INFLUXDB_PASSWORD >> .env
    echo NEXTAUTH_SECRET=$(mcookie) >> .env
    echo POSTGRES_PASSWORD=$(mcookie) >> .env

fi

echo "You also need to set the following environment variables in your .env file:"
echo "KEYCLOAK_CLIENT_SECRET - Instructions for getting this value here: https://stackoverflow.com/questions/75647456/post-call-to-keycloak-to-fetch-access-token-works-in-postman-but-not-from-axios"
echo "INFLUXDB_TOKEN - This can be gotten by going to the influxdb UI and going to data -> tokens -> generate"
echo "PORTAINER_ACCESS_TOKEN - This can be gotten by logging into the portainer UI, clicking on the username in the top right, then My account, then + add access token"
