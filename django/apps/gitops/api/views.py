from django.conf import settings
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.viewsets import ModelViewSet

from apps.gitops.api.pagination import DefaultPagination
from apps.gitops.api.serializers import BrokerSerializer
from apps.gitops.api.serializers import GitopsSerializer
from apps.gitops.api.serializers import PipelineEditorStartSerializer
from apps.gitops.api.services.pipeline_editor import PipelineEditorConfigurator
from apps.gitops.api.services.utils import generate_auth_token
from apps.gitops.models import Brokers
from apps.gitops.models import Gitops


class GitopsViewSet(ModelViewSet):
    pagination_class = DefaultPagination
    ordering_fields = ["-updated_at"]

    def get_serializer_class(self):
        return GitopsSerializer

    def get_queryset(self):
        return Gitops.objects.all()


class BrokerViewSet(ModelViewSet):
    pagination_class = DefaultPagination
    ordering_fields = ["-updated_at"]

    def get_serializer_class(self):
        return BrokerSerializer

    def get_queryset(self):
        return Brokers.objects.all()


class PipelineIDEStartView(APIView):
    def get_serializer(self, *args, **kwargs):
        return PipelineEditorStartSerializer(*args, **kwargs)

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)

        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        secret_key = serializer.validated_data.get("secret_key")
        deployment_id = serializer.validated_data.get("deployment_id")

        gitops = get_object_or_404(Gitops, secret_key=secret_key)

        editor_configurator = PipelineEditorConfigurator(
            rathole_config_path=settings.RATHOLE_CONFIG_PATH,
            traefik_config_path=settings.TRAEFIK_CONFIG_PATH,
        )
        token = generate_auth_token()

        editor_configurator.initialise_pipeline_ide_deployment(
            token=token,
            deployment_id=deployment_id,
            company_slug=gitops.keycloak_group_slug,
            middleware="keycloak",
        )

        return Response({"token": token}, status=status.HTTP_200_OK)
