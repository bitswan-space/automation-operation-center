"""
Automation Server API authentication views
"""
import logging

from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from drf_spectacular.utils import extend_schema

from bitswan_backend.core.models import AutomationServer

L = logging.getLogger("core.views.automation_server.authentication")


@extend_schema(
    tags=["Automation Server API - Authentication"],
    summary="Exchange OTP for Access Token",
    description="""
    Exchanges a one-time password (OTP) for a long-lived access token.
    
    This endpoint is used by the bitswan CLI to authenticate and obtain an access token
    that can be used for subsequent API calls. The OTP can only be used once and must
    be used within 10 minutes of generation.
    
    **CLI Usage:**
    ```bash
    bitswan register --name "my-server" --aoc-api "https://api.example.com" --otp "ABC123DEF456GHI789JKL012MNO"
    ```
    
    **Token Permissions:**
    - Can create and manage workspaces within the specific automation server
    - Cannot access other automation servers
    - Cannot perform administrative operations outside the automation server scope
    - Token expires after 1 year
    
    **Security Notes:**
    - OTP is single-use and expires after 10 minutes
    - Access token is long-lived (1 year) for convenience
    - Token is scoped to the specific automation server only
    """,
    request={
        "application/json": {
            "type": "object",
            "properties": {
                "otp": {
                    "type": "string",
                    "description": "One-time password received from the web interface",
                    "example": "ABC123DEF456GHI789JKL012MNO"
                },
                "automation_server_id": {
                    "type": "string",
                    "description": "UUID of the automation server",
                    "example": "123e4567-e89b-12d3-a456-426614174000"
                }
            },
            "required": ["otp", "automation_server_id"]
        }
    },
    responses={
        200: {
            "description": "OTP successfully exchanged for access token",
            "content": {
                "application/json": {
                    "example": {
                        "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
                        "automation_server_id": "123e4567-e89b-12d3-a456-426614174000",
                        "expires_at": "2025-09-26T17:34:42.123456Z"
                    }
                }
            }
        },
        400: {
            "description": "Invalid or expired OTP",
            "content": {
                "application/json": {
                    "example": {
                        "error": "Invalid or expired OTP."
                    }
                }
            }
        },
        404: {
            "description": "Automation server not found",
            "content": {
                "application/json": {
                    "example": {
                        "error": "Invalid automation server ID."
                    }
                }
            }
        }
    }
)
class ExchangeOTPForTokenAPIView(APIView):
    """
    Exchange OTP for access token - used by CLI
    """
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request):
        otp = request.data.get("otp")
        automation_server_id = request.data.get("automation_server_id")
        
        if not otp or not automation_server_id:
            return Response(
                {"error": "OTP and automation_server_id are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            # Find the automation server
            server = AutomationServer.objects.get(
                automation_server_id=automation_server_id
            )
        except AutomationServer.DoesNotExist:
            return Response(
                {"error": "Invalid automation server ID."},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Validate OTP
        if not server.is_otp_valid(otp):
            return Response(
                {"error": "Invalid or expired OTP."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Generate access token
        access_token = server.generate_access_token()
        
        # Clear the OTP after successful exchange
        server.otp = None
        server.otp_expires_at = None
        server.save()

        return Response(
            {
                "access_token": access_token,
                "automation_server_id": server.automation_server_id,
                "expires_at": server.token_expires_at.isoformat(),
            },
            status=status.HTTP_200_OK,
        )
