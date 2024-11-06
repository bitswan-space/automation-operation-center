#!/bin/bash

# Define the directory and file paths
DIR="/etc/kafka-ui"
FILE="$DIR/config.yml"

# Prompt for clientId and clientSecret
read -p "Enter clientId: " clientId
read -p "Enter clientSecret: " clientSecret

# Check if the directory exists, create it if it doesn't
if [ ! -d "$DIR" ]; then
    echo "Creating directory: $DIR"
    mkdir -p "$DIR"
fi

# Write the content to the file
cat > "$FILE" << EOF
auth:
  type: OAUTH2
  oauth2:
    client:
      keycloak:
        clientId: $clientId
        clientSecret: $clientSecret
        scope: openid
        issuer-uri: https://keycloak.bitswan.space/auth/realms/master
        user-name-attribute: preferred_username
        client-name: keycloak
        provider: keycloak
        custom-params:
          type: keycloak
EOF

echo "Configuration written to $FILE"
