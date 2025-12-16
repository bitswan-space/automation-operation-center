import logging

from django.shortcuts import get_object_or_404
from rest_framework.permissions import SAFE_METHODS
from rest_framework.permissions import BasePermission

from bitswan_backend.core.models import AutomationServer
from bitswan_backend.core.models import Workspace
from bitswan_backend.core.models.workspaces import WorkspaceGroupMembership
from bitswan_backend.core.services.keycloak import KeycloakService

L = logging.getLogger("core.permissions.workspaces")


class CanReadOrgEMQXJWT(BasePermission):
    """
    Permission to allow a user to read a workspace's EMQX JWT token.
    """

    keycloak = KeycloakService()

    def has_permission(self, request, view):
        user_orgs = self.keycloak.get_active_user_orgs(request)
        workspace = get_object_or_404(Workspace, pk=view.kwargs.get("pk"))

        user_is_org_member = False
        for org in user_orgs:
            if org.get("id") == workspace.keycloak_org_id:
                user_is_org_member = True
                break

        L.info(f"User is org member: {user_is_org_member}")

        return (
            user_is_org_member
            and request.user.is_active
            and request.user.is_authenticated
            and request.method in SAFE_METHODS
        )


class CanReadWorkspaceEMQXJWT(CanReadOrgEMQXJWT):
    """
    Permission to allow a user to read a workspace's EMQX JWT token.
    """


class CanReadWorkspacePipelineEMQXJWT(CanReadOrgEMQXJWT):
    """
    Permission to allow a user to read a workspace's pipeline EMQX JWT token.
    """


class CanReadAutomationServerEMQXJWT(BasePermission):
    """
    Permission to allow a user to read an automation server's EMQX JWT token.
    """

    keycloak = KeycloakService()

    def has_permission(self, request, view):
        org_id = self.keycloak.get_active_user_org(request).get("id")

        try:
            automation_server = AutomationServer.objects.get(
                automation_server_id=view.kwargs.get("automation_server_id"),
            )
        except AutomationServer.DoesNotExist:
            L.error(
                "Automation server not found for user: %s",
            )
            return (
                request.user.is_active
                and request.user.is_authenticated
                and request.method in SAFE_METHODS
            )

        return (
            automation_server.keycloak_org_id == org_id
            and request.user.is_active
            and request.user.is_authenticated
            and request.method in SAFE_METHODS
        )


class HasAccessToWorkspace(BasePermission):
    """
    Permission to allow a user to access a workspace.
    Admins have access, otherwise users must be members of at least one group
    that the workspace belongs to.
    """

    keycloak = KeycloakService()

    def has_permission(self, request, view):
        """
        Check if the user has access to the workspace.
        """
        workspace = get_object_or_404(Workspace, pk=view.kwargs.get("pk"))

        # Admins have access
        if self.keycloak.is_admin(request):
            return True

        # Check if user has access through group membership
        user_id = self.keycloak.get_active_user(request)
        user_groups = self.keycloak.get_user_groups(user_id)
        user_group_ids = [group['id'] for group in user_groups]

        # Get workspace group memberships
        workspace_group_ids = WorkspaceGroupMembership.objects.filter(
            workspace=workspace
        ).values_list('keycloak_group_id', flat=True)

        # Check if user has access to any workspace group
        return any(group_id in user_group_ids for group_id in workspace_group_ids)

