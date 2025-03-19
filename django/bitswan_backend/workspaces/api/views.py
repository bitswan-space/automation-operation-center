import datetime

import jwt
from django.conf import settings
from rest_framework import status
from rest_framework import views
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from bitswan_backend.core.authentication import KeycloakAuthentication
from bitswan_backend.core.viewmixins import KeycloakMixin
from bitswan_backend.workspaces.api.serializers import WorkspaceSerializer
from bitswan_backend.workspaces.models import Workspace


def create_token(
    secret: str,
    profile_id: str | None = None,
    keycloak_org_id: str | None = None,
    workspace: Workspace = None,
    deployment_id: str | None = None,
):
    exp = datetime.datetime.now(datetime.UTC) + datetime.timedelta(hours=2)
    exp_timestamp = int(exp.timestamp())

    mountpoint = ""
    username = ""

    if profile_id and keycloak_org_id:
        mountpoint = f"/profiles/{keycloak_org_id}/{profile_id}"
        username = profile_id

    elif workspace:

        base_mountpoint = (
            f"/automation-servers/{workspace.keycloak_org_id}/{workspace.automation_server_id}",
        )
        workspace_path = f"/c/{workspace.id}"

        if deployment_id:
            mountpoint = f"{"".join(base_mountpoint)}{workspace_path}/c/{deployment_id}"
        else:
            mountpoint = f"{"".join(base_mountpoint)}{workspace_path}"
        username = workspace.id

    payload = {
        "exp": exp_timestamp,
        "username": username,
        "client_attrs": {"mountpoint": mountpoint},
    }

    return jwt.encode(payload, secret, algorithm="HS256")


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

        token = create_token(secret=settings.EMQX_JWT_SECRET, workspace=workspace)

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
            workspace=workspace,
            deployment_id=deployment_id,
        )

        return Response(
            {
                "token": token,
            },
            status=status.HTTP_200_OK,
        )


class GetProfileEmqxJWT(KeycloakMixin, views.APIView):
    authentication_classes = [KeycloakAuthentication]

    def get(self, request, profile_id):
        org_id = self.get_active_user_org_id()

        token = create_token(
            settings.EMQX_JWT_SECRET,
            profile_id=profile_id,
            keycloak_org_id=org_id,
        )

        return Response(
            {
                "token": token,
            },
            status=status.HTTP_200_OK,
        )
