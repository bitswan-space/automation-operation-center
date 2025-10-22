"""
Automation Server API workspace management views
"""
import logging
import os

from django.conf import settings
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema

from bitswan_backend.core.services.keycloak import KeycloakService
from bitswan_backend.core.authentication import AutomationServerAuthentication
from bitswan_backend.core.models import Workspace
from bitswan_backend.core.serializers.workspaces import WorkspaceSerializer
from bitswan_backend.core.utils.mqtt import create_mqtt_token
from .server_info import AutomationServerMixin

L = logging.getLogger("core.views.automation_server.workspaces")


@extend_schema(tags=["Automation Server API - Workspaces"])
class WorkspaceAPIViewSet(AutomationServerMixin, viewsets.ModelViewSet):
    """
    ViewSet for automation servers to manage their workspaces
    """
    serializer_class = WorkspaceSerializer
    authentication_classes = [AutomationServerAuthentication]
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Only return workspaces belonging to the authenticated automation server"""
        automation_server = self.get_automation_server()
        if not automation_server:
            return Workspace.objects.none()
        return Workspace.objects.filter(automation_server_id=automation_server.automation_server_id)
    
    def perform_create(self, serializer):
        """Set the automation server when creating a workspace"""
        automation_server = self.get_automation_server()
        serializer.save(automation_server_id=automation_server.automation_server_id)

    @action(
        detail=True,
        methods=["get"],
        url_path="emqx/jwt",
    )
    def emqx_jwt(self, request, pk=None):
        """Get EMQX JWT token for a workspace"""
        workspace = self.get_object()
        automation_server = self.get_automation_server()
        
        # Ensure this workspace belongs to the authenticated automation server
        if workspace.automation_server_id != automation_server.automation_server_id:
            return Response(
                {"error": "Workspace does not belong to this automation server"},
                status=status.HTTP_403_FORBIDDEN
            )

        mountpoint = (
            f"/orgs/{automation_server.keycloak_org_id}/"
            f"automation-servers/{automation_server.automation_server_id}/"
            f"c/{workspace.id!s}"
        )
        username = str(workspace.id)

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
            status=status.HTTP_200_OK,
        )

    @action(
        detail=True,
        methods=["get"],
        url_path="keycloak/client-secret",
    )
    def keycloak_client_secret(self, request, pk=None):
        """Get Keycloak client secret for a workspace"""
        workspace = self.get_object()
        automation_server = self.get_automation_server()
        
        # Ensure this workspace belongs to the authenticated automation server
        if workspace.automation_server_id != automation_server.automation_server_id:
            return Response(
                {"error": "Workspace does not belong to this automation server"},
                status=status.HTTP_403_FORBIDDEN
            )
            
        keycloak_service = KeycloakService()
        
        # Get the client secret
        client_id = f"workspace-{workspace.id}-code-server-client"
        client_secret = keycloak_service.get_client_secrets(client_id)            
        
        if not client_secret:
            return Response(
                {"error": f"Client secret not found for workspace {workspace.name}. The workspace client may not have been created yet."},
                status=status.HTTP_404_NOT_FOUND
            )
        
        return Response(
            {
                "client_id": client_id,
                "client_secret": client_secret,
                "workspace_name": workspace.name,
                "issuer_url": f"{settings.KEYCLOAK_FRONTEND_URL}/realms/{settings.KEYCLOAK_REALM_NAME}",
            },
            status=status.HTTP_200_OK,
        
        )
        
