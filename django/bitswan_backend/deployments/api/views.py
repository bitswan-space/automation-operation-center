import logging
import os
import hmac
import hashlib
import subprocess

from django.conf import settings
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.permissions import AllowAny
from django.http import JsonResponse

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
            rathole_host_name=settings.RATHOLE_SERVER_HOST,
            traefik_host_name=settings.TRAEFIK_SERVER_HOST,
        )
        token = generate_secret()

        deployment = editor_configurator.initialise_pipeline_ide_deployment(
            token=token,
            deployment_id=deployment_id,
            company_slug=self.get_active_user_org_name_slug(),
            middleware="keycloak",
        )

        return Response(
            {
                "token": token,
                "url": deployment.get("url"),
                "service_name": deployment.get("service_name"),
            },
            status=status.HTTP_200_OK,
        )


@api_view(['POST'])
@authentication_classes([])
@permission_classes([AllowAny])
def update_webhook(request):
    """
    Update webhook endpoint to trigger AOC updates when changes are merged to main.
    """
    # Validate webhook signature
    signature = request.headers.get('X-Hub-Signature-256')
    if not signature:
        logger.warning("Update webhook called without signature")
        return Response(
            {"error": "Missing signature"}, 
            status=status.HTTP_401_UNAUTHORIZED
        )
    
    # Get the webhook secret from settings
    webhook_secret = getattr(settings, 'UPDATE_WEBHOOK_SECRET', None)
    if not webhook_secret:
        logger.error("UPDATE_WEBHOOK_SECRET not configured")
        return Response(
            {"error": "Webhook not configured"}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    
    # Validate signature
    expected_signature = 'sha256=' + hmac.new(
        webhook_secret.encode('utf-8'),
        request.body,
        hashlib.sha256
    ).hexdigest()
    
    if not hmac.compare_digest(signature, expected_signature):
        logger.warning("Invalid update webhook signature")
        return Response(
            {"error": "Invalid signature"}, 
            status=status.HTTP_401_UNAUTHORIZED
        )
    
    try:
        # Trigger the AOC update
        logger.info("Triggering AOC update via webhook")
        
        # Run the update command
        result = subprocess.run(
            ["bitswan", "on-prem-aoc", "update"],
            capture_output=True,
            text=True,
            timeout=300  # 5 minute timeout
        )
        
        if result.returncode == 0:
            logger.info("AOC update completed successfully")
            return Response(
                {
                    "message": "AOC update triggered successfully",
                    "output": result.stdout
                }, 
                status=status.HTTP_200_OK
            )
        else:
            logger.error(f"AOC update failed: {result.stderr}")
            return Response(
                {
                    "error": "AOC update failed",
                    "stderr": result.stderr
                }, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
            
    except subprocess.TimeoutExpired:
        logger.error("AOC update timed out")
        return Response(
            {"error": "AOC update timed out"}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    except Exception as e:
        logger.error(f"Error triggering AOC update: {str(e)}")
        return Response(
            {"error": f"Error triggering update: {str(e)}"}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


def current_deployed_version(request):
    versions = {}
    if os.getenv("AOC_VERSION"):
        versions["aoc"] = os.getenv("AOC_VERSION")
    
    if os.getenv("BITSWAN_BACKEND_VERSION"):
        versions["bitswan-backend"] = os.getenv("BITSWAN_BACKEND_VERSION")
    
    if os.getenv("PROFILE_MANAGER_VERSION"):
        versions["profile-manager"] = os.getenv("PROFILE_MANAGER_VERSION")

    return JsonResponse(versions)
