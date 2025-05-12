import logging
import os
from profile import Profile
import uuid

from core.pagination import DefaultPagination
from django.conf import settings
from rest_framework import status
from rest_framework import views
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from bitswan_backend.core.authentication import KeycloakAuthentication
from bitswan_backend.core.viewmixins import KeycloakMixin
from bitswan_backend.workspaces.api.serializers import AutomationServerSerializer
from bitswan_backend.workspaces.api.serializers import WorkspaceSerializer
from bitswan_backend.workspaces.api.services import create_token
from bitswan_backend.workspaces.models import AutomationServer
from bitswan_backend.workspaces.models import Workspace
from bitswan_backend.workspaces.permissions import CanReadProfileEMQXJWT
from bitswan_backend.workspaces.permissions import CanReadWorkspaceEMQXJWT
from bitswan_backend.workspaces.permissions import CanReadWorkspacePipelineEMQXJWT

L = logging.getLogger("workspaces.api.views")


# FIXME: Currently a Keycloak JWT token will be authorized even after it has expired.
#        Consider reworking the oidc flow setup to prevent this.
class WorkspaceViewSet(KeycloakMixin, viewsets.ModelViewSet):
    queryset = Workspace.objects.all()
    serializer_class = WorkspaceSerializer
    authentication_classes = [KeycloakAuthentication]

    def get_queryset(self):
        org_id = self.get_active_user_org_id()
        return Workspace.objects.filter(keycloak_org_id=org_id).order_by("-updated_at")

    def perform_create(self, serializer):
        serializer.save(keycloak_org_id=self.get_active_user_org_id())

    def perform_update(self, serializer):
        serializer.save(keycloak_org_id=self.get_active_user_org_id())

    @action(
        detail=True,
        methods=["GET"],
        url_path="emqx/jwt",
        permission_classes=[CanReadWorkspaceEMQXJWT],
    )
    def emqx_jwt(self, request, pk=None):
        workspace = self.get_object()

        org_id = self.get_active_user_org_id()

        mountpoint = (
            f"/orgs/{org_id}/"
            f"automation-servers/{workspace.automation_server_id}/"
            f"c/{str(workspace.id)}"
        )
        username = str(workspace.id)

        token = create_token(
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

        org_id = self.get_active_user_org_id()

        mountpoint = (
            f"/orgs/{org_id}/"
            f"automation-servers/{workspace.automation_server_id}/"
            f"c/{str(workspace.id)}/c/{deployment_id}"
        )
        username = str(workspace.id)

        token = create_token(
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


class AutomationServerViewSet(KeycloakMixin, viewsets.ModelViewSet):
    queryset = AutomationServer.objects.all()
    serializer_class = AutomationServerSerializer
    pagination_class = DefaultPagination
    authentication_classes = [KeycloakAuthentication]

    def get_queryset(self):
        org_id = self.get_active_user_org_id()
        return AutomationServer.objects.filter(keycloak_org_id=org_id).order_by(
            "-updated_at",
        )

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
        org_id = self.get_active_user_org_id()

        mountpoint = (
            f"/orgs/{org_id}/"
            f"automation-servers/{workspace.automation_server_id}/"
            f"c/{str(workspace.id)}"
        )
        username = str(workspace.id)

        token = create_token(
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


class GetProfileEmqxJWTAPIView(KeycloakMixin, views.APIView):
    authentication_classes = [KeycloakAuthentication]
    permission_classes = [CanReadProfileEMQXJWT]

    def get(self, request, profile_id):
        org_id = self.get_active_user_org_id()
        is_admin = self.is_admin(request)
        
        profile_id = f"{org_id}_group_{profile_id}{'_admin' if is_admin else ''}"

        mountpoint = f"/orgs/{org_id}/profiles/{profile_id}"
        username = profile_id

        token = create_token(
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


class GetProfileManagerEmqxJWTAPIView(KeycloakMixin, views.APIView):
    authentication_classes = [KeycloakAuthentication]

    def get(self, request):
        token = create_token(
            secret=settings.EMQX_JWT_SECRET,
            username="root",
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
        server_name = request.query_params.get("server_name")
        if not device_code or not server_name:
            return Response(
                {"error": "Device code and server name are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        device_registration = self.poll_device_registration(device_code)
        if "error" in device_registration:
            return Response(
                device_registration,
                status=device_registration["status_code"],
            )
        if "access_token" in device_registration:
            # Check if the automation server with same server name already exists
            # in the same org
            org_id = self.get_user_org_id(device_registration["access_token"])
            automation_server = AutomationServer.objects.filter(
                name=server_name,
                keycloak_org_id=org_id,
            ).first()
            if automation_server:
                return Response(
                    {"error": "Automation server already exists."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            automation_server = AutomationServer.objects.create(
                name=server_name,
                automation_server_id=uuid.uuid4(),
                keycloak_org_id=org_id,
            )
            device_registration[
                "automation_server_id"
            ] = automation_server.automation_server_id
            return Response(device_registration, status=status.HTTP_200_OK)

        return Response(
            device_registration,
            status=device_registration["status_code"],
        )
