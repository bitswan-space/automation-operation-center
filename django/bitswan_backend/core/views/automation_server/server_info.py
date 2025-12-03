"""
Automation Server API server information views
"""
import logging
import os

from django.conf import settings
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from drf_spectacular.utils import extend_schema

from bitswan_backend.core.authentication import AutomationServerAuthentication
from bitswan_backend.core.serializers.automation_server import AutomationServerSerializer
from bitswan_backend.core.utils.mqtt import create_mqtt_token

L = logging.getLogger("core.views.automation_server.server_info")


class AutomationServerMixin:
    """
    Mixin for automation server API views that provides common functionality
    """
    
    def get_automation_server(self):
        """Get the automation server from the authenticated request"""
        return getattr(self.request, 'automation_server', None)


@extend_schema(tags=["Automation Server API - Server Info"])
class AutomationServerInfoAPIView(AutomationServerMixin, APIView):
    """
    Get information about the current automation server
    """
    authentication_classes = [AutomationServerAuthentication]
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        automation_server = self.get_automation_server()
        serializer = AutomationServerSerializer(automation_server)
        return Response(serializer.data)


@extend_schema(
    tags=["Automation Server API - Server Info"],
    summary="Get EMQX JWT for Automation Server",
    description="""
    Get MQTT JWT token for the automation server itself.
    This token allows the automation server daemon to subscribe to workspace/init and workspace/remove topics.
    """,
    responses={
        200: {
            "description": "MQTT credentials retrieved successfully",
            "content": {
                "application/json": {
                    "example": {
                        "url": "mqtt://emqx.example.com:1883",
                        "token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
                    }
                }
            }
        }
    }
)
class AutomationServerEmqxJwtAPIView(AutomationServerMixin, APIView):
    """
    Get EMQX JWT token for the automation server
    """
    authentication_classes = [AutomationServerAuthentication]
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        automation_server = self.get_automation_server()
        
        # Create MQTT token with mountpoint at automation server level
        # The mountpoint allows subscribing to workspace/init and workspace/remove topics
        mountpoint = f"/orgs/{automation_server.keycloak_org_id}/automation-servers/{automation_server.automation_server_id}/"
        username = f"bitswan-automation-server-{automation_server.automation_server_id}"
        
        token = create_mqtt_token(
            secret=settings.EMQX_JWT_SECRET,
            username=username,
            mountpoint=mountpoint,
        )
        
        return Response(
            {
                "url": os.getenv("EMQX_EXTERNAL_URL"),
                "token": token,
            },
            status=200,
        )
