"""
General API views for the application
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from drf_spectacular.utils import extend_schema

from bitswan_backend.core.views.deployment import current_deployed_version


@extend_schema(
    tags=["General API"],
    summary="Get Current Version",
    description="Returns the current deployed version information for all components",
    responses={
        200: {
            "description": "Version information retrieved successfully",
            "content": {
                "application/json": {
                    "example": {
                        "aoc": "aoc:latest",
                        "bitswan-backend": "bitswan-backend:v1.0.0",
                        "keycloak": "keycloak:latest"
                    }
                }
            }
        }
    }
)
class VersionAPIView(APIView):
    """
    Get current deployed version information for all components
    """
    authentication_classes = []  # No authentication required
    permission_classes = [AllowAny]
    
    def get(self, request):
        """Get current version information"""

        # Use the existing deployment view function
        response = current_deployed_version(request)
        # JsonResponse has .content, not .data
        import json
        data = json.loads(response.content.decode('utf-8'))
        return Response(data, status=status.HTTP_200_OK)

