import logging

from django.shortcuts import get_object_or_404
from rest_framework.permissions import SAFE_METHODS
from rest_framework.permissions import BasePermission

from bitswan_backend.core.services.keycloak import KeycloakService
from bitswan_backend.workspaces.models import AutomationServer
from bitswan_backend.workspaces.models import Workspace

L = logging.getLogger("core.permissions.mqtt_profiles")


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


class CanReadProfileEMQXJWT(BasePermission):
    """
    Permission to allow a user to read a profile's EMQX JWT token.
    """

    keycloak = KeycloakService()

    def has_permission(self, request, view):
        active_user_id = self.keycloak.get_active_user(request)

        is_group_member = self.keycloak.is_group_member(
            user_id=active_user_id,
            group_id=view.kwargs.get("profile_id"),
        )

        return (
            is_group_member
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
