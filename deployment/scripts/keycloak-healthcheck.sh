#!/bin/sh


MAX_RETRIES=10
RETRY_COUNT=0


until curl --head -fsS http://localhost:9000/health/ready; do
  RETRY_COUNT=$((RETRY_COUNT + 1))
  echo "Waiting for Keycloak... Attempt $RETRY_COUNT of $MAX_RETRIES"

  if [ $RETRY_COUNT -ge $MAX_RETRIES ]; then
    echo "Keycloak health check failed after $MAX_RETRIES attempts."
    exit 1
  fi

  sleep 5
done


echo "Keycloak is ready!"
touch /tmp/keycloak-ready
exit 0
