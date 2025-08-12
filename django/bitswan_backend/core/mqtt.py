import paho.mqtt.client as mqtt
from django.conf import settings
import json
import logging

from bitswan_backend.core.services.keycloak import KeycloakService
from bitswan_backend.workspaces.api.services import create_token

logger = logging.getLogger(__name__)

class MQTTClient:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(MQTTClient, cls).__new__(cls)
            cls._instance.client = None
        return cls._instance

    def __init__(self):
        if not self.client:
            self.client = mqtt.Client()
            self.setup_client()

    def setup_client(self):
        # Get MQTT settings from Django settings
        mqtt_url = getattr(settings, 'EMQX_INTERNAL_URL')
        mqtt_url = mqtt_url.split(':')
        mqtt_host = mqtt_url[0]
        mqtt_port = int(mqtt_url[1])
        mqtt_username = "bitswan-backend"
        mqtt_password = create_token(secret=settings.EMQX_JWT_SECRET, username=mqtt_username)

        if mqtt_username and mqtt_password:
            self.client.username_pw_set(mqtt_username, mqtt_password)

        def on_connect(client, userdata, flags, rc):
            if rc == 0:
                logger.info("Connected to MQTT broker")
            else:
                logger.error(f"Failed to connect to MQTT broker with code {rc}")

        def on_disconnect(client, userdata, rc):
            logger.warning("Disconnected from MQTT broker")

        self.client.on_connect = on_connect
        self.client.on_disconnect = on_disconnect

        try:
            self.client.connect(mqtt_host, mqtt_port)
            self.client.loop_start()
        except Exception as e:
            logger.error(f"Error connecting to MQTT broker: {e}")

    def publish(self, topic, payload, qos=0, retain=False):
        if isinstance(payload, (dict, list)):
            payload = json.dumps(payload)
        try:
            self.client.publish(topic, payload, qos, retain)
            logger.debug(f"Published message to {topic}: {payload}")
        except Exception as e:
            logger.error(f"Error publishing to MQTT: {e}")

    def disconnect(self):
        if self.client:
            self.client.loop_stop()
            self.client.disconnect()

class MQTTService:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(MQTTService, cls).__new__(cls)
        return cls._instance

    def __init__(self):
        self.mqtt_client = MQTTClient()
        self.keycloak_service = KeycloakService()

    def publish_org_profiles(self, organization_id):
        try:
            groups = self.keycloak_service.get_org_groups(organization_id)
            profiles = []
            for group in groups:
                profiles.append(f"{organization_id}_group_{group['id']}")
                profiles.append(f"{organization_id}_group_{group['id']}_admin")

            topic = f"/orgs/{organization_id}/profiles"
            self.mqtt_client.publish(topic, profiles, retain=True)
        except Exception as e:
            logger.error(f"Error publishing organization profiles: {e}")

    def publish_orgs_profiles(self):
        try:
            orgs = self.keycloak_service.get_orgs()
            for org in orgs:
                self.publish_org_profiles(org['id'])
        except Exception as e:
            logger.error(f"Error publishing organizations profiles: {e}")
