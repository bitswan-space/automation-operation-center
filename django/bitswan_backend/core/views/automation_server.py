import logging
import os

from core.pagination import DefaultPagination
from django.conf import settings
from rest_framework import status
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from bitswan_backend.core.authentication import KeycloakAuthentication
from bitswan_backend.core.permissions.emqx import CanReadWorkspaceEMQXJWT
from bitswan_backend.core.serializers.automation_server import (
    AutomationServerSerializer,
)
from bitswan_backend.core.serializers.automation_server import (
    CreateAutomationServerSerializer,
)
from bitswan_backend.core.utils.mqtt import create_mqtt_token
from bitswan_backend.core.viewmixins import KeycloakMixin
from bitswan_backend.core.models import AutomationServer, AutomationServerGroupMembership

L = logging.getLogger("core.views.automation_server")


class AutomationServerViewSet(KeycloakMixin, viewsets.ModelViewSet):
    queryset = AutomationServer.objects.all()
    serializer_class = AutomationServerSerializer
    pagination_class = DefaultPagination
    authentication_classes = [KeycloakAuthentication]

    def get_queryset(self):
        org_id = self.get_org_id()
        
        # Check if user is admin in the org - admins can see all automation servers
        if self.is_admin(self.request):
            return AutomationServer.objects.filter(keycloak_org_id=org_id).order_by(
                "-updated_at",
            )
        
        # For non-admin users, filter by AutomationServerGroupMembership
        user_id = self.get_active_user()
        user_groups = self.keycloak.get_user_groups(user_id)
        user_group_ids = [group['id'] for group in user_groups]
        
        # Get automation servers that the user has access to through group memberships
        accessible_automation_server_ids = AutomationServerGroupMembership.objects.filter(
            keycloak_group_id__in=user_group_ids
        ).values_list('automation_server_id', flat=True)
        
        return AutomationServer.objects.filter(
            keycloak_org_id=org_id,
            id__in=accessible_automation_server_ids
        ).order_by("-updated_at")

    def create(self, request):
        serializer = CreateAutomationServerSerializer(
            data=request.data,
            context={"view": self, "request": request},
        )

        if serializer.is_valid():
            group = serializer.save()
            return Response(group, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=["get"], url_path="token")
    def get_token(self, request):
        new_token = self.get_token_from_token(request)
        return Response({"token": new_token["access_token"]})

    @action(
        detail=True,
        methods=["get"],
        url_path="emqx/jwt",
        permission_classes=[CanReadWorkspaceEMQXJWT],
    )
    def emqx_jwt(self, request, pk=None):
        workspace = self.get_object()
        org_id = workspace.keycloak_org_id

        mountpoint = (
            f"/orgs/{org_id}/"
            f"automation-servers/{workspace.automation_server_id}/"
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
