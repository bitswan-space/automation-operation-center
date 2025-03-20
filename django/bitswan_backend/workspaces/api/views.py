import logging

from django.conf import settings
from rest_framework import status
from rest_framework import views
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from bitswan_backend.core.authentication import KeycloakAuthentication
from bitswan_backend.core.viewmixins import KeycloakMixin
from bitswan_backend.workspaces.api.serializers import WorkspaceSerializer
from bitswan_backend.workspaces.api.services import create_token
from bitswan_backend.workspaces.models import AutomationServer
from bitswan_backend.workspaces.models import Workspace

L = logging.getLogger(__name__)


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

    @action(detail=True, methods=["GET"], url_path="emqx/jwt")
    def emqx_jwt(self, request, pk=None):
        workspace = self.get_object()

        # TODO: add check to see if workspace can be viewed by caller

        token = create_token(
            secret=settings.EMQX_JWT_SECRET,
            config={"workspace": workspace},
        )

        return Response(
            {
                "token": token,
            },
            status=status.HTTP_200_OK,
        )

    @action(
        detail=True,
        methods=["GET"],
        url_path="pipelines/(?P<deployment_id>[^/.]+)/emqx/jwt",
    )
    def pipeline_jwt(self, request, pk=None, deployment_id=None):
        workspace = self.get_object()

        # TODO: add check to see if workspace can be viewed by caller

        token = create_token(
            secret=settings.EMQX_JWT_SECRET,
            config={"workspace": workspace, "deployment_id": deployment_id},
        )

        return Response(
            {
                "token": token,
            },
            status=status.HTTP_200_OK,
        )


class GetProfileEmqxJWTAPIView(KeycloakMixin, views.APIView):
    authentication_classes = [KeycloakAuthentication]

    def get(self, request, profile_id):
        org_id = self.get_active_user_org_id()

        token = create_token(
            settings.EMQX_JWT_SECRET,
            config={"profile_id": profile_id, "keycloak_org_id": org_id},
        )

        return Response(
            {
                "token": token,
            },
            status=status.HTTP_200_OK,
        )


class GetProfileManagerEmqxJWTAPIView(KeycloakMixin, views.APIView):
    authentication_classes = [KeycloakAuthentication]

    def get(self, request):
        token = create_token(settings.EMQX_JWT_SECRET, config={})

        return Response(
            {
                "token": token,
            },
            status=status.HTTP_200_OK,
        )


class GetAutomationServerEmqxJWTAPIView(KeycloakMixin, views.APIView):
    authentication_classes = [KeycloakAuthentication]

    def get(self, request, automation_server_id):
        org_id = self.get_active_user_org_id()

        try:
            automation_server = AutomationServer.objects.get(
                automation_server_id=automation_server_id,
                keycloak_org_id=org_id,
            )
        except AutomationServer.DoesNotExist:
            return Response(
                {"error": "Automation server not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        L.info("Got automation server: %s", automation_server)

        token = create_token(
            settings.EMQX_JWT_SECRET,
            config={
                "automation_server_id": automation_server_id,
                "keycloak_org_id": org_id,
            },
        )

        return Response(
            {
                "token": token,
            },
            status=status.HTTP_200_OK,
        )
