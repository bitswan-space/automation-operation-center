"""
Frontend API views for workspace management
"""
import json
import logging
import os

from django.conf import settings
from django.shortcuts import get_object_or_404
from keycloak import KeycloakDeleteError
from keycloak import KeycloakPutError
from rest_framework import status
from rest_framework import views
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema

from bitswan_backend.core.authentication import KeycloakAuthentication
from bitswan_backend.core.models import Workspace
from bitswan_backend.core.viewmixins import KeycloakMixin
from bitswan_backend.core.serializers.workspaces import WorkspaceSerializer
from bitswan_backend.core.utils.mqtt import create_mqtt_token
from bitswan_backend.core.permissions.workspaces import CanReadWorkspaceEMQXJWT
from bitswan_backend.core.permissions.workspaces import CanReadWorkspacePipelineEMQXJWT
from bitswan_backend.core.permissions.workspaces import HasAccessToWorkspace
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
    pagination_class = DefaultPagination
    authentication_classes = [KeycloakAuthentication]
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        org_id = self.get_org_id()
        
        # Get query parameters
        automation_server_id = self.request.query_params.get('automation_server_id')
        search = self.request.query_params.get('search')
        
        # Base queryset filter
        filters = {'keycloak_org_id': org_id}
        
        # Add automation server filter if provided
        if automation_server_id:
            filters['automation_server_id'] = automation_server_id
        
        # Add search filter if provided
        if search:
            filters['name__icontains'] = search
        
        # Check if user is admin in the org - admins can see all workspaces
        if self.is_admin(self.request):
            return Workspace.objects.filter(**filters).order_by("-updated_at")
        
        # For non-admin users, filter by WorkspaceGroupMembership
        user_id = self.get_active_user()
        user_groups = self.keycloak.get_user_groups(user_id)
        user_group_ids = [group['id'] for group in user_groups]
        
        # Get workspaces that the user has access to through group memberships
        accessible_workspace_ids = WorkspaceGroupMembership.objects.filter(
            keycloak_group_id__in=user_group_ids
        ).values_list('workspace_id', flat=True)
        
        # Add workspace access filter
        filters['id__in'] = accessible_workspace_ids
        
        return Workspace.objects.filter(**filters).order_by("-updated_at")

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

    @action(
        detail=True, 
        methods=["POST"], 
        url_path="add_to_group", 
        permission_classes=[HasAccessToWorkspace],
    )
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

    @action(
        detail=True, 
        methods=["POST"], 
        url_path="remove_from_group", 
        permission_classes=[HasAccessToWorkspace],
    )
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

    @action(
        detail=True,
        methods=["GET"],
        url_path="groups",
        permission_classes=[HasAccessToWorkspace],
    )
    def groups(self, request, pk=None):
        """
        GET /workspaces/<workspace_id>/groups
        Returns full group objects (not just IDs) for the specified workspace.
        """
        try:
            # Get the workspace
            workspace = get_object_or_404(Workspace, pk=pk)
            
            # Get all group memberships for this workspace
            memberships = WorkspaceGroupMembership.objects.filter(workspace=workspace)
            
            # Fetch full group objects from Keycloak
            groups = []
            for membership in memberships:
                try:
                    group = self.keycloak.get_org_group(membership.keycloak_group_id)
                    groups.append(group)
                except Exception as e:
                    L.warning(f"Failed to fetch group {membership.keycloak_group_id}: {str(e)}")
                    # Continue with other groups even if one fails
            
            return Response(groups, status=status.HTTP_200_OK)
            
        except Exception as e:
            L.error(f"Error fetching workspace groups: {str(e)}")
            return Response(
                {"error": "Failed to fetch workspace groups"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(
        detail=True,
        methods=["GET"],
        url_path="users",
        permission_classes=[HasAccessToWorkspace],
    )
    def users(self, request, pk=None):
        """
        GET /workspaces/<workspace_id>/users
        Returns users that are members of the workspace's workspace_group_id group.
        """
        try:
            # Get the workspace
            workspace = get_object_or_404(Workspace, pk=pk)
            
            # Check if workspace has a group assigned
            if not workspace.workspace_group_id:
                return Response(
                    {"error": "Workspace does not have a group assigned"}, 
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Fetch users from the group using Keycloak
            try:
                users = self.keycloak.keycloak_admin.get_group_members(
                    group_id=workspace.workspace_group_id,
                )
            except Exception as e:
                L.error(f"Error fetching group members from Keycloak: {str(e)}")
                return Response(
                    {"error": "Failed to fetch group members"}, 
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
            
            return Response(users, status=status.HTTP_200_OK)
            
        except Exception as e:
            L.error(f"Error fetching workspace group users: {str(e)}")
            return Response(
                {"error": "Failed to fetch workspace group users"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(
        detail=True,
        methods=["GET"],
        url_path="non-member-groups",
        permission_classes=[HasAccessToWorkspace],
    )
    def non_member_groups(self, request, pk=None):
        """
        GET /workspaces/<workspace_id>/non-member-groups
        Returns groups that the workspace is NOT a member of.
        """
        try:
            # Get the workspace
            workspace = get_object_or_404(Workspace, pk=pk)
            
            # Get all org groups
            org_groups = self.get_org_groups()
            
            # Get groups that workspace IS a member of
            workspace_memberships = WorkspaceGroupMembership.objects.filter(workspace=workspace)
            workspace_group_ids = {membership.keycloak_group_id for membership in workspace_memberships}
            
            # Filter to find groups the workspace is NOT a member of
            non_member_groups = [
                group for group in org_groups 
                if group["id"] not in workspace_group_ids
            ]
            
            return Response(non_member_groups, status=status.HTTP_200_OK)
            
        except Exception as e:
            L.error(f"Error fetching non-member groups: {str(e)}")
            return Response(
                {"error": "Failed to fetch non-member groups"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(
        detail=True,
        methods=["GET"],
        url_path="non-member-users",
        permission_classes=[HasAccessToWorkspace],
    )
    def non_member_users(self, request, pk=None):
        """
        GET /workspaces/<workspace_id>/non-member-users
        Returns users that are NOT members of the workspace's workspace_group_id group.
        """
        try:
            # Get the workspace
            workspace = get_object_or_404(Workspace, pk=pk)
            
            # Check if workspace has a group assigned
            if not workspace.workspace_group_id:
                return Response(
                    {"error": "Workspace does not have a group assigned"}, 
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Get all org users
            org_users = self.get_org_users()
            
            # Get users that ARE members of the workspace group
            try:
                group_member_ids = set()
                group_members = self.keycloak.keycloak_admin.get_group_members(
                    group_id=workspace.workspace_group_id,
                )
                group_member_ids = {user["id"] for user in group_members}
            except Exception as e:
                L.warning(f"Error fetching group members for filtering: {str(e)}")
                # If we can't get group members, return all org users
                group_member_ids = set()
            
            # Filter to find users that are NOT members of the workspace group
            non_member_users = [
                user for user in org_users
                if user.get("id") not in group_member_ids
            ]
            
            return Response(non_member_users, status=status.HTTP_200_OK)
            
        except Exception as e:
            L.error(f"Error fetching non-member users: {str(e)}")
            return Response(
                {"error": "Failed to fetch non-member users"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(
        detail=True,
        methods=["POST"],
        url_path="add_user",
        permission_classes=[HasAccessToWorkspace],
    )
    def add_user(self, request, pk=None):
        """
        POST /workspaces/<workspace_id>/add_user
        Add a user to the workspace's workspace_group_id group.
        """
        try:
            workspace = get_object_or_404(Workspace, pk=pk)
            user_id = request.data.get("user_id")
            
            if not user_id:
                return Response(
                    {"error": "user_id is required"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Check if workspace has a group assigned
            if not workspace.workspace_group_id:
                return Response(
                    {"error": "Workspace does not have a group assigned"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Add user to the workspace group
            self.add_user_to_group(
                group_id=workspace.workspace_group_id,
                user_id=user_id
            )
            
            return Response(status=status.HTTP_200_OK)
            
        except KeycloakPutError as e:
            L.error(f"Error adding user to workspace group: {str(e)}")
            error_message = "Failed to add user to workspace group"
            try:
                if hasattr(e, 'error_message') and e.error_message:
                    parsed_error = json.loads(e.error_message)
                    error_message = parsed_error.get("errorMessage", error_message)
            except (json.JSONDecodeError, AttributeError):
                pass
            return Response(
                {"error": error_message},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        except Exception as e:
            L.error(f"Error adding user to workspace group: {str(e)}")
            return Response(
                {"error": "Failed to add user to workspace group"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(
        detail=True,
        methods=["POST"],
        url_path="remove_user",
        permission_classes=[HasAccessToWorkspace],
    )
    def remove_user(self, request, pk=None):
        """
        POST /workspaces/<workspace_id>/remove_user
        Remove a user from the workspace's workspace_group_id group.
        """
        try:
            workspace = get_object_or_404(Workspace, pk=pk)
            user_id = request.data.get("user_id")
            
            if not user_id:
                return Response(
                    {"error": "user_id is required"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Check if workspace has a group assigned
            if not workspace.workspace_group_id:
                return Response(
                    {"error": "Workspace does not have a group assigned"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Remove user from the workspace group
            self.remove_user_from_group(
                group_id=workspace.workspace_group_id,
                user_id=user_id
            )
            
            return Response(status=status.HTTP_200_OK)
            
        except KeycloakDeleteError as e:
            L.error(f"Error removing user from workspace group: {str(e)}")
            error_message = "Failed to remove user from workspace group"
            try:
                if hasattr(e, 'error_message') and e.error_message:
                    parsed_error = json.loads(e.error_message)
                    error_message = parsed_error.get("errorMessage", error_message)
            except (json.JSONDecodeError, AttributeError):
                pass
            return Response(
                {"error": error_message},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        except Exception as e:
            L.error(f"Error removing user from workspace group: {str(e)}")
            return Response(
                {"error": "Failed to remove user from workspace group"}, 
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

