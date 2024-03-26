import logging

from django.conf import settings
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from bitswan_backend.core.authentication import KeycloakAuthentication
from bitswan_backend.core.utils.secrets import generate_secret
from bitswan_backend.core.viewmixins import KeycloakMixin
from bitswan_backend.deployments.api.serializers import PipelineEditorStartSerializer
from bitswan_backend.deployments.services.pipeline_editor import (
    PipelineEditorConfigurator,
)
from bitswan_backend.gitops.models import Gitops

logger = logging.getLogger(__name__)


class PipelineIDEStartView(KeycloakMixin, APIView):
    authentication_classes = [KeycloakAuthentication]

    def post(self, request, *args, **kwargs):
        serializer = PipelineEditorStartSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        secret_key = serializer.validated_data.get("secret_key")
        deployment_id = serializer.validated_data.get("deployment_id")

        get_object_or_404(Gitops, secret_key=secret_key)

        editor_configurator = PipelineEditorConfigurator(
            rathole_config_path=settings.RATHOLE_CONFIG_PATH,
            traefik_config_path=settings.TRAEFIK_CONFIG_PATH,
        )
        token = generate_secret()

        url = editor_configurator.initialise_pipeline_ide_deployment(
            token=token,
            deployment_id=deployment_id,
            company_slug=self.get_active_user_org_name_slug(),
            middleware="keycloak",
        )

        return Response({"token": token, "url": url}, status=status.HTTP_200_OK)
