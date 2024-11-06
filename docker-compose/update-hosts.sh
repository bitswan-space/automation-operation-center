#!/bin/bash

DOMAINS=(
    "platform.local"
    "poc.platform.local"
    "influx.platform.local"
    "keycloak.platform.local"
    "mqtt.platform.local"
    "portainer.platform.local"
)

HOSTS_FILE="/etc/hosts"

sudo cp $HOSTS_FILE "${HOSTS_FILE}.backup.$(date +%Y%m%d_%H%M%S)"

# Check if entries already exist
for DOMAIN in "${DOMAINS[@]}"; do
    if grep -q "$DOMAIN" $HOSTS_FILE; then
        echo "Entry for $DOMAIN already exists in hosts file"
    else
        echo "Adding entry for $DOMAIN"
        echo "127.0.0.1 $DOMAIN" | sudo tee -a $HOSTS_FILE > /dev/null
    fi
done

# Flush DNS cache
if [ "$(uname)" == "Darwin" ]; then
    # macOS
    sudo dscacheutil -flushcache
    sudo killall -HUP mDNSResponder
    echo "Flushed DNS cache (macOS)"
else
    # Linux (assuming systemd)
    sudo systemctl restart systemd-resolved
    echo "Flushed DNS cache (Linux)"
fi

echo "Hosts file has been updated. A backup was created at ${HOSTS_FILE}.backup.*"
echo "Please try accessing your services again"
