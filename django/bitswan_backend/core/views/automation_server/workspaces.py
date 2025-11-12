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
        
        # Check if workspace has a Keycloak client ID
        if not workspace.keycloak_internal_client_id:
            return Response(
                {
                    "error": "No Keycloak client found for this workspace. The workspace may not have been properly configured.",
                    "client_id": None,
                    "client_secret": None,
                    "issuer_url": f"{settings.KEYCLOAK_FRONTEND_URL}/realms/{settings.KEYCLOAK_REALM_NAME}",
                },
                status=status.HTTP_404_NOT_FOUND
            )
            
        keycloak_service = KeycloakService()
        client_id = f"workspace-{workspace.id}-code-server-client"
        client_secret = keycloak_service.get_client_secrets(str(workspace.keycloak_internal_client_id))
        
        # Check if client secret retrieval was successful
        if client_secret is None:
            return Response(
                {
                    "error": "Failed to retrieve client secret from Keycloak",
                    "client_id": client_id,
                    "client_secret": None,
                    "issuer_url": f"{settings.KEYCLOAK_FRONTEND_URL}/realms/{settings.KEYCLOAK_REALM_NAME}",
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
        return Response(
            {
                "client_id": client_id,
                "client_secret": client_secret,
                "issuer_url": f"{settings.KEYCLOAK_FRONTEND_URL}/realms/{settings.KEYCLOAK_REALM_NAME}",
            },
            status=status.HTTP_200_OK,
        )

    @action(
        detail=True,
        methods=["post"],
        url_path="keycloak/add-redirect-uri",
    )
    def add_redirect_uri(self, request, pk=None):
        """Add a redirect URI to the workspace's Keycloak client"""
        workspace = self.get_object()
        automation_server = self.get_automation_server()
        
        # Ensure this workspace belongs to the authenticated automation server
        if workspace.automation_server_id != automation_server.automation_server_id:
            return Response(
                {"error": "Workspace does not belong to this automation server"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Check if workspace has a Keycloak client ID
        if not workspace.keycloak_internal_client_id:
            return Response(
                {
                    "error": "No Keycloak client found for this workspace. The workspace may not have been properly configured.",
                },
                status=status.HTTP_404_NOT_FOUND
            )
        
        redirect_uri = request.data.get("redirect_uri")
        if not redirect_uri:
            return Response(
                {
                    "error": "Missing required field: redirect_uri"
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Add the redirect URI
        keycloak_service = KeycloakService()
        result = keycloak_service.add_workspace_redirect_uri(
            str(workspace.keycloak_internal_client_id),
            redirect_uri.strip()
        )
        
        # Check if the operation was successful
        if not result.get("success"):
            return Response(
                {
                    "error": result.get("error", "Failed to add redirect URI")
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        return Response(
            {
                "success": True,
                "message": result.get("message", "Redirect URI added successfully"),
                "redirect_uris": result.get("redirect_uris", [])
            },
            status=status.HTTP_200_OK,
        )
