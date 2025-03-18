import datetime

import jwt
from django.conf import settings
from rest_framework import status
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from bitswan_backend.core.authentication import KeycloakAuthentication
from bitswan_backend.core.viewmixins import KeycloakMixin
from bitswan_backend.workspaces.api.serializers import WorkspaceSerializer
from bitswan_backend.workspaces.models import Workspace


def create_token(workspace: Workspace, secret: str):
    exp = datetime.datetime.now(datetime.UTC) + datetime.timedelta(hours=2)
    exp_timestamp = int(exp.timestamp())

    mountpoint = (
        f"/automation-servers/{workspace.keycloak_org_id}/{workspace.automation_server_id}",
        f"/c/{workspace.id}/",
    )

    payload = {
        "exp": exp_timestamp,
        "username": workspace.id,
        "client_attrs": {"mountpoint": "".join(mountpoint)},
    }

    return jwt.encode(payload, secret, algorithm="HS256")


# FIXME: Currently a token will be authorized even after it has expired.
#        Consider reworking the oidc flow setup.
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

    @action(detail=True, methods=["GET"])
    def jwt(self, request, pk=None):
        workspace = self.get_object()

        token = create_token(workspace, settings.EMQX_JWT_SECRET)

        return Response(
            {
                "token": token,
            },
            status=status.HTTP_200_OK,
        )
