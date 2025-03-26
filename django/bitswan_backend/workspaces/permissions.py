import logging

from rest_framework.permissions import SAFE_METHODS
from rest_framework.permissions import BasePermission

from bitswan_backend.core.services.keycloak import KeycloakService
from bitswan_backend.workspaces.models import AutomationServer

L = logging.getLogger("workspaces.permissions")


class CanReadOrgEMQXJWT(BasePermission):
    """
    Permission to allow a user to read a workspace's EMQX JWT token.
    """

    keycloak = KeycloakService()

    def has_permission(self, request, view):
        org_id = self.keycloak.get_active_user_org(request).get("id")
        workspace = view.get_object()

        return (
            workspace.keycloak_org_id == org_id
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


class CanReadProfileEMQXJWT(BasePermission):
    """
    Permission to allow a user to read a profile's EMQX JWT token.
    """

    keycloak = KeycloakService()

    def has_permission(self, request, view):
        org_id = self.keycloak.get_active_user_org(request).get("id")

        active_user_id = self.keycloak.get_active_user(request)

        is_group_member = self.keycloak.is_group_member(
            user_id=active_user_id,
            group_id=view.kwargs.get("profile_id"),
        )

        return (
            request.user.org_id == org_id
            and is_group_member
            and request.user.is_active
            and request.user.is_authenticated
            and request.method in SAFE_METHODS
        )


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
