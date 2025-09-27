"""
Configuration API views for the frontend
"""
import os
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from drf_spectacular.utils import extend_schema

from bitswan_backend.core.authentication import KeycloakAuthentication


@extend_schema(
    tags=["Frontend API - Configuration"],
    summary="Get Frontend Configuration",
    description="Returns configuration values needed by the frontend application",
    responses={
        200: {
            "description": "Configuration retrieved successfully",
            "content": {
                "application/json": {
                    "example": {
                        "bitswanBackendApiUrl": "https://api.example.com"
                    }
                }
            }
        }
    }
)
class ConfigAPIView(APIView):
    """
    Get configuration for the frontend application
    """
    permission_classes = [AllowAny]
    
    def get(self, request):
        """Get frontend configuration"""
        try:
            # Get the current request's host to build the API URL
            api_url = request.build_absolute_uri('/')[:-1]  # Remove trailing slash
            
            return Response({
                "bitswanBackendApiUrl": api_url,
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {"error": "Internal server error"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
