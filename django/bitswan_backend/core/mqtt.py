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

    def publish_automation_server_groups(self, automation_server):
        """
        Publish automation server groups to MQTT with persistent message
        """
        try:
            from bitswan_backend.core.models.automation_server import AutomationServerGroupMembership
            
            # Get all group memberships for this automation server
            memberships = AutomationServerGroupMembership.objects.filter(
                automation_server=automation_server
            )
            
            # Extract group IDs
            group_ids = [membership.keycloak_group_id for membership in memberships]
            
            topic = f"/orgs/{automation_server.keycloak_org_id}/automation-servers/{automation_server.automation_server_id}/groups"
            self.mqtt_client.publish(topic, group_ids, retain=True)
            logger.info(f"Published automation server groups to {topic}: {group_ids}")
            
        except Exception as e:
            logger.error(f"Error publishing automation server groups: {e}")

    def publish_workspace_groups(self, workspace):
        """
        Publish workspace groups to MQTT with persistent message
        """
        try:
            from bitswan_backend.core.models.workspaces import WorkspaceGroupMembership
            
            # Get all group memberships for this workspace
            memberships = WorkspaceGroupMembership.objects.filter(
                workspace=workspace
            )
            
            # Extract group IDs and add admin group
            group_ids = []
            
            # Add admin group
            admin_group = self.keycloak_service.get_admin_org_group(workspace.keycloak_org_id)
            if admin_group:
                group_ids.append(admin_group["id"])
            
            # Add editor groups
            for membership in memberships:
                group = self.keycloak_service.get_org_group(membership.keycloak_group_id)
                if "workspace-editor" in group.get("permissions", []):
                    group_ids.append(membership.keycloak_group_id)
            
            topic = f"/orgs/{workspace.keycloak_org_id}/automation-servers/{workspace.automation_server_id}/c/{workspace.id}/groups"
            self.mqtt_client.publish(topic, group_ids, retain=True)
            logger.info(f"Published workspace groups to {topic}: {group_ids}")
            
        except Exception as e:
            logger.error(f"Error publishing workspace groups: {e}")

    def publish_all_groups(self):
        """
        Publish all groups for all organizations on startup
        """
        try:
            from bitswan_backend.core.models.automation_server import AutomationServer
            from bitswan_backend.core.models.workspaces import Workspace
            
            # Publish automation server groups
            automation_servers = AutomationServer.objects.all()
            for server in automation_servers:
                self.publish_automation_server_groups(server)
            
            # Publish workspace groups
            workspaces = Workspace.objects.all()
            for workspace in workspaces:
                self.publish_workspace_groups(workspace)
                
            logger.info("Successfully published all groups on startup")
            
        except Exception as e:
            logger.error(f"Error publishing all groups on startup: {e}")
