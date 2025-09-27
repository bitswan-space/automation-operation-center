"""
Frontend API views for workspace management
"""
import logging
import os

from django.conf import settings
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework import views
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema

from bitswan_backend.core.authentication import KeycloakAuthentication
from bitswan_backend.core.models import AutomationServer
from bitswan_backend.core.models import Workspace
from bitswan_backend.core.viewmixins import KeycloakMixin
from bitswan_backend.core.serializers.workspaces_new import AutomationServerSerializer
from bitswan_backend.core.serializers.workspaces_new import CreateAutomationServerSerializer
from bitswan_backend.core.serializers.workspaces_new import WorkspaceSerializer
from bitswan_backend.core.utils.mqtt import create_mqtt_token
from bitswan_backend.core.permissions.workspaces import CanReadWorkspaceEMQXJWT
from bitswan_backend.core.permissions.workspaces import CanReadWorkspacePipelineEMQXJWT
from bitswan_backend.core.pagination import DefaultPagination

from bitswan_backend.core.models.workspaces import WorkspaceGroupMembership
from bitswan_backend.core.models.automation_server import AutomationServerGroupMembership


L = logging.getLogger("core.views.workspaces")


# FIXME: Currently a Keycloak JWT token will be authorized even after it has expired.
#        Consider reworking the oidc flow setup to prevent this.
@extend_schema(tags=["Frontend API - Workspaces"])
class WorkspaceViewSet(KeycloakMixin, viewsets.ModelViewSet):
    queryset = Workspace.objects.all()
    serializer_class = WorkspaceSerializer
    authentication_classes = [KeycloakAuthentication]
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        org_id = self.get_org_id()
        
        # Check if user is admin in the org - admins can see all workspaces
        if self.is_admin(self.request):
            return Workspace.objects.filter(keycloak_org_id=org_id).order_by("-updated_at")
        
        # For non-admin users, filter by WorkspaceGroupMembership
        user_id = self.get_active_user()
        user_groups = self.keycloak.get_user_groups(user_id)
        user_group_ids = [group['id'] for group in user_groups]
        
        # Get workspaces that the user has access to through group memberships
        accessible_workspace_ids = WorkspaceGroupMembership.objects.filter(
            keycloak_group_id__in=user_group_ids
        ).values_list('workspace_id', flat=True)
        
        return Workspace.objects.filter(
            keycloak_org_id=org_id,
            id__in=accessible_workspace_ids
        ).order_by("-updated_at")

    @action(
        detail=True,
        methods=["GET"],
        url_path="emqx/jwt",
        permission_classes=[CanReadWorkspaceEMQXJWT],
    )
    def emqx_jwt(self, request, pk=None):
        workspace = get_object_or_404(Workspace, pk=pk)

        L.info(f"Getting emqx jwt for workspace in: {workspace}")
        org_id = str(workspace.keycloak_org_id)

        mountpoint = (
            f"/orgs/{org_id}/"
            f"automation-servers/{workspace.automation_server_id}/"
            f"c/{str(workspace.id)}"
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
        methods=["GET"],
        url_path="pipelines/(?P<deployment_id>[^/.]+)/emqx/jwt",
        permission_classes=[CanReadWorkspacePipelineEMQXJWT],
    )
    def pipeline_jwt(self, request, pk=None, deployment_id=None):
        workspace = get_object_or_404(Workspace, pk=pk)

        org_id = workspace.keycloak_org_id

        mountpoint = (
            f"/orgs/{org_id}/"
            f"automation-servers/{workspace.automation_server_id}/"
            f"c/{str(workspace.id)}/c/{deployment_id}"
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

    @action(detail=True, methods=["POST"], url_path="add_to_group")
    def add_to_group(self, request, pk=None):
        """
        Add workspace to a group by creating a WorkspaceGroupMembership entry
        """
        try:
            workspace = get_object_or_404(Workspace, pk=pk)
            group_id = request.data.get("group_id")
            
            if not group_id:
                return Response(
                    {"error": "group_id is required"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Validate that the group_id is a valid Keycloak group
            try:
                # This will raise an exception if the group doesn't exist
                self.keycloak.get_org_group(group_id)
            except Exception as e:
                L.warning(f"Invalid group_id provided: {group_id}, error: {str(e)}")
                return Response(
                    {"error": "Invalid group_id: Group does not exist in Keycloak"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Check if membership already exists
            existing_membership = WorkspaceGroupMembership.objects.filter(
                workspace=workspace,
                keycloak_group_id=group_id
            ).first()
            
            if existing_membership:
                return Response(
                    {"error": "Workspace is already a member of this group"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Create new membership
            WorkspaceGroupMembership.objects.create(
                workspace=workspace,
                keycloak_group_id=group_id
            )
            
            return Response(status=status.HTTP_201_CREATED)
            
        except Exception as e:
            L.error(f"Error adding workspace to group: {str(e)}")
            return Response(
                {"error": "Failed to add workspace to group"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=["POST"], url_path="remove_from_group")
    def remove_from_group(self, request, pk=None):
        """
        Remove workspace from a group by deleting the WorkspaceGroupMembership entry
        """
        try:
            workspace = get_object_or_404(Workspace, pk=pk)
            group_id = request.data.get("group_id")
            
            if not group_id:
                return Response(
                    {"error": "group_id is required"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Check if membership exists
            membership = WorkspaceGroupMembership.objects.filter(
                workspace=workspace,
                keycloak_group_id=group_id
            ).first()
            
            if not membership:
                return Response(
                    {"error": "Workspace is not a member of this group"}, 
                    status=status.HTTP_400_BAD_REQUEST)
            
            # Delete the membership
            membership.delete()
            
            return Response(status=status.HTTP_200_OK)
            
        except Exception as e:
            L.error(f"Error removing workspace from group: {str(e)}")
            return Response(
                {"error": "Failed to remove workspace from group"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

@extend_schema(tags=["Frontend API - MQTT"])
class GetUserEmqxJwtsAPIView(KeycloakMixin, views.APIView):
    authentication_classes = [KeycloakAuthentication]
    permission_classes = [AllowAny]

    def get_user_accessible_workspaces(self):
        """
        Helper method to get workspaces that the user has access to based on group membership.
        Returns a list of workspaces with their mountpoint information.
        """
        try:
            # Get the current user's ID
            user_id = self.get_active_user()
            
            # Get all groups the user belongs to
            user_groups = self.keycloak.get_user_groups(user_id)
            user_group_ids = [group['id'] for group in user_groups]
            
            # Get the organization ID
            org_id = self.get_org_id()
            
            # Get all workspaces for the organization
            all_workspaces = Workspace.objects.filter(keycloak_org_id=org_id).select_related('automation_server')
            
            if not all_workspaces.exists():
                return []
            
            # Build the filtered list
            accessible_workspaces = []
            
            for workspace in all_workspaces:
                # Get automation server groups for this workspace's automation server
                automation_server_groups = AutomationServerGroupMembership.objects.filter(
                    automation_server=workspace.automation_server
                ).values_list('keycloak_group_id', flat=True)
                
                # Get workspace groups for this workspace
                workspace_groups = WorkspaceGroupMembership.objects.filter(
                    workspace=workspace
                ).values_list('keycloak_group_id', flat=True)
                
                automation_server_match = len(automation_server_groups) == 0  # If no groups, allow all
                if automation_server_groups:
                    # Check if user has access to any automation server group
                    automation_server_match = any(group_id in user_group_ids for group_id in automation_server_groups)
                
                workspace_match = len(workspace_groups) == 0  # If no groups, allow all
                if workspace_groups:
                    # Check if user has access to any workspace group
                    workspace_match = any(group_id in user_group_ids for group_id in workspace_groups)
                
                # Workspace must match both automation server and workspace groups
                if automation_server_match and workspace_match:
                    mountpoint = (
                        f"/orgs/{org_id}/"
                        f"automation-servers/{workspace.automation_server_id}/"
                        f"c/{str(workspace.id)}"
                    )
                    
                    accessible_workspaces.append({
                        'automation_server_id': workspace.automation_server_id,
                        'workspace_id': str(workspace.id),
                        'mountpoint': mountpoint
                    })
            
            return accessible_workspaces
            
        except Exception as e:
            L.error(f"Error getting user accessible workspaces: {str(e)}")
            return []

    def get(self, request):
        """
        GET /user/emqx/jwts
        Returns a list of JWT tokens with mountpoints for workspaces the user has access to.
        """
        try:
            org_id = self.get_org_id()
            
            # If the user is an admin, return a JWTs with mountpoint to all workspaces
            if self.is_admin(request):
                # Get all workspaces for the organization
                all_workspaces = Workspace.objects.filter(keycloak_org_id=org_id).select_related('automation_server')
                
                tokens = []
                for workspace in all_workspaces:
                    token = create_mqtt_token(
                        secret=settings.EMQX_JWT_SECRET,
                        username=str(workspace.id),
                        mountpoint=f"/orgs/{org_id}/automation-servers/{workspace.automation_server_id}/c/{str(workspace.id)}",
                    )
                    tokens.append({
                        'automation_server_id': workspace.automation_server_id,
                        'workspace_id': workspace.id,
                        'token': token
                    })
                
                
                return Response(
                    {
                        'url': os.getenv("EMQX_EXTERNAL_URL"),
                        "tokens": tokens
                    },
                    status=status.HTTP_200_OK
                )
            
            # Get accessible workspaces
            accessible_workspaces = self.get_user_accessible_workspaces()
            
            if not accessible_workspaces:
                return Response(
                    {
                        "url": os.getenv("EMQX_EXTERNAL_URL"),
                        "tokens": []
                    },
                    status=status.HTTP_200_OK
                )
            
            # Generate JWT tokens for each workspace
            tokens = []
            for workspace_info in accessible_workspaces:
                # Create JWT token for this workspace
                token = create_mqtt_token(
                    secret=settings.EMQX_JWT_SECRET,
                    username=workspace_info['workspace_id'],
                    mountpoint=workspace_info['mountpoint'],
                )
                
                tokens.append({
                    'automation_server_id': workspace_info['automation_server_id'],
                    'workspace_id': workspace_info['workspace_id'],
                    'token': token
                })
            
            return Response(
                {
                    "url": os.getenv("EMQX_EXTERNAL_URL"),
                    "tokens": tokens,
                },
                status=status.HTTP_200_OK
            )
            
        except Exception as e:
            L.error(f"Error generating user EMQX JWTs: {str(e)}")
            return Response(
                {"error": "Failed to generate EMQX JWTs"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

