import logging
import os

from django.conf import settings
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework import views
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from bitswan_backend.core.authentication import KeycloakAuthentication
from bitswan_backend.core.permissions.emqx import CanReadWorkspaceEMQXJWT
from bitswan_backend.core.permissions.emqx import CanReadWorkspacePipelineEMQXJWT
from bitswan_backend.core.serializers.workspaces import WorkspaceSerializer
from bitswan_backend.core.utils.mqtt import create_mqtt_token
from bitswan_backend.core.viewmixins import KeycloakMixin
from bitswan_backend.workspaces.models import Workspace

L = logging.getLogger("core.views.workspaces")


# FIXME: Currently a Keycloak JWT token will be authorized even after it has expired.
#        Consider reworking the oidc flow setup to prevent this.
class WorkspaceViewSet(KeycloakMixin, viewsets.ModelViewSet):
    queryset = Workspace.objects.all()
    serializer_class = WorkspaceSerializer
    authentication_classes = [KeycloakAuthentication]

    def get_queryset(self):
        org_id = self.get_org_id()
        return Workspace.objects.filter(keycloak_org_id=org_id).order_by("-updated_at")

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
        methods=["GET"],
        url_path="pipelines/(?P<deployment_id>[^/.]+)/emqx/jwt",
        permission_classes=[CanReadWorkspacePipelineEMQXJWT],
    )
    def pipeline_jwt(self, request, pk=None, deployment_id=None):
        workspace = self.get_object()

        org_id = workspace.keycloak_org_id

        mountpoint = (
            f"/orgs/{org_id}/"
            f"automation-servers/{workspace.automation_server_id}/"
            f"c/{workspace.id!s}/c/{deployment_id}"
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


class RegisterCLIAPIView(KeycloakMixin, views.APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request):
        device_registration = self.start_device_registration()
        return Response(device_registration, status=status.HTTP_200_OK)

    def get(self, request):
        device_code = request.query_params.get("device_code")
        if not device_code:
            return Response(
                {"error": "Device code is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        device_registration = self.poll_device_registration(device_code)
        if "error" in device_registration:
            return Response(
                device_registration,
                status=device_registration.get("status_code"),
            )

        return Response(
            device_registration,
            status=device_registration.get("status_code"),
        )
