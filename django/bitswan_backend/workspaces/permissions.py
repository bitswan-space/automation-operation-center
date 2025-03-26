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

        org_users = self.keycloak.get_org_users(org_id=org_id)
        org_user_emails = [user["email"] for user in org_users]

        return (
            request.user.org_id == org_id
            and request.user.get_username() in org_user_emails
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
