import logging
import os
import uuid

from core.pagination import DefaultPagination
from django.conf import settings
from rest_framework import status
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework.views import APIView
from drf_spectacular.utils import extend_schema, OpenApiParameter, OpenApiExample
from drf_spectacular.types import OpenApiTypes

from bitswan_backend.core.authentication import KeycloakAuthentication
from bitswan_backend.core.permissions.emqx import CanReadWorkspaceEMQXJWT
from bitswan_backend.core.serializers.automation_server import (
    AutomationServerSerializer,
)
from bitswan_backend.core.serializers.automation_server import (
    CreateAutomationServerSerializer,
)
from bitswan_backend.core.utils.mqtt import create_mqtt_token
from bitswan_backend.core.viewmixins import KeycloakMixin
from bitswan_backend.core.models import AutomationServer, AutomationServerGroupMembership

L = logging.getLogger("core.views.automation_server")


class AutomationServerViewSet(KeycloakMixin, viewsets.ModelViewSet):
    queryset = AutomationServer.objects.all()
    serializer_class = AutomationServerSerializer
    pagination_class = DefaultPagination
    authentication_classes = [KeycloakAuthentication]

    def get_queryset(self):
        org_id = self.get_org_id()
        
        # Check if user is admin in the org - admins can see all automation servers
        if self.is_admin(self.request):
            return AutomationServer.objects.filter(keycloak_org_id=org_id).order_by(
                "-updated_at",
            )
        
        # For non-admin users, filter by AutomationServerGroupMembership
        user_id = self.get_active_user()
        user_groups = self.keycloak.get_user_groups(user_id)
        user_group_ids = [group['id'] for group in user_groups]
        
        # Get automation servers that the user has access to through group memberships
        accessible_automation_server_ids = AutomationServerGroupMembership.objects.filter(
            keycloak_group_id__in=user_group_ids
        ).values_list('automation_server_id', flat=True)
        
        return AutomationServer.objects.filter(
            keycloak_org_id=org_id,
            id__in=accessible_automation_server_ids
        ).order_by("-updated_at")

    def create(self, request):
        serializer = CreateAutomationServerSerializer(
            data=request.data,
            context={"view": self, "request": request},
        )

        if serializer.is_valid():
            group = serializer.save()
            return Response(group, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=["get"], url_path="token")
    def get_token(self, request):
        # This endpoint is now deprecated in favor of the OTP-based system
        # For backward compatibility, we'll return an error message
        return Response(
            {"error": "This endpoint is deprecated. Use the OTP-based registration flow instead."},
            status=status.HTTP_410_GONE,
        )

    @action(
        detail=True,
        methods=["get"],
        url_path="emqx/jwt",
        permission_classes=[CanReadWorkspaceEMQXJWT],
    )
    def emqx_jwt(self, request, pk=None):
        workspace = self.get_object()
        org_id = workspace.keycloak_org_id

        mountpoint = (
            f"/orgs/{org_id}/"
            f"automation-servers/{workspace.automation_server_id}/"
            f"c/{workspace.id!s}"
        )
        username = str(workspace.id)

        token = create_mqtt_token(
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


@extend_schema(
    tags=["CLI Integration"],
    summary="Create Automation Server with OTP",
    description="""
    Creates a new automation server and generates a one-time password (OTP) for CLI registration.
    
    This endpoint is used by the web interface when a user wants to connect an automation server.
    The generated OTP must be used within 10 minutes and can only be used once.
    
    **Workflow:**
    1. User clicks "Connect Automation Server" in the web interface
    2. User enters a server name and clicks "Create Server"
    3. This endpoint creates the automation server and returns an OTP
    4. The web interface displays the OTP and CLI command to the user
    5. User runs the CLI command with the OTP on their automation server
    6. CLI exchanges the OTP for an access token using `/api/automation-servers/exchange-otp/`
    """,
    request={
        "application/json": {
            "type": "object",
            "properties": {
                "name": {
                    "type": "string",
                    "description": "Name for the automation server",
                    "example": "my-production-server"
                }
            },
            "required": ["name"]
        }
    },
    responses={
        201: {
            "description": "Automation server created successfully",
            "content": {
                "application/json": {
                    "example": {
                        "automation_server_id": "123e4567-e89b-12d3-a456-426614174000",
                        "otp": "ABC12345",
                        "message": "Automation server created successfully. Use the OTP with the CLI command."
                    }
                }
            }
        },
        400: {
            "description": "Bad request - server name already exists or missing",
            "content": {
                "application/json": {
                    "example": {
                        "error": "Automation server with this name already exists."
                    }
                }
            }
        }
    }
)
class CreateAutomationServerWithOTPAPIView(KeycloakMixin, APIView):
    """
    Create an automation server and generate an OTP for CLI registration
    """
    authentication_classes = [KeycloakAuthentication]

    def post(self, request):
        name = request.data.get("name")
        if not name:
            return Response(
                {"error": "Server name is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Get the user's organization
        org_id = self.get_org_id()
        
        # Check if automation server with this name already exists in the org
        existing_server = AutomationServer.objects.filter(
            name=name,
            keycloak_org_id=org_id
        ).first()
        
        if existing_server:
            return Response(
                {"error": "Automation server with this name already exists."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Create the automation server
        server = AutomationServer.objects.create(
            name=name,
            automation_server_id=str(uuid.uuid4()),
            keycloak_org_id=org_id,
        )

        # Generate OTP
        otp = server.generate_otp()

        return Response(
            {
                "automation_server_id": server.automation_server_id,
                "otp": otp,
                "message": "Automation server created successfully. Use the OTP with the CLI command."
            },
            status=status.HTTP_201_CREATED,
        )


@extend_schema(
    tags=["CLI Integration"],
    summary="Exchange OTP for Access Token",
    description="""
    Exchanges a one-time password (OTP) for a long-lived access token.
    
    This endpoint is used by the bitswan CLI to authenticate and obtain an access token
    that can be used for subsequent API calls. The OTP can only be used once and must
    be used within 10 minutes of generation.
    
    **CLI Usage:**
    ```bash
    bitswan register --name "my-server" --aoc-api "https://api.example.com" --otp "ABC12345"
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
                    "example": "ABC12345"
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


@extend_schema(
    tags=["CLI Integration"],
    summary="Check OTP Redemption Status",
    description="""
    Checks whether an OTP has been redeemed by the CLI.
    
    This endpoint is used by the web interface to poll for OTP redemption status.
    When the OTP is redeemed, the modal can automatically close and refresh the
    automation servers list.
    
    **Usage:**
    - Called every few seconds by the web interface modal
    - Returns `redeemed: true` when OTP has been used
    - Returns `redeemed: false` when OTP is still valid and unused
    """,
    parameters=[
        OpenApiParameter(
            name="automation_server_id",
            type=OpenApiTypes.STR,
            location=OpenApiParameter.QUERY,
            description="UUID of the automation server",
            required=True
        )
    ],
    responses={
        200: {
            "description": "OTP status retrieved successfully",
            "content": {
                "application/json": {
                    "examples": {
                        "not_redeemed": {
                            "summary": "OTP not yet redeemed",
                            "value": {
                                "redeemed": False,
                                "otp": "ABC12345",
                                "expires_at": "2025-09-26T17:44:42.123456Z"
                            }
                        },
                        "redeemed": {
                            "summary": "OTP has been redeemed",
                            "value": {
                                "redeemed": True,
                                "redeemed_at": "2025-09-26T17:35:15.789012Z"
                            }
                        }
                    }
                }
            }
        },
        404: {
            "description": "Automation server not found",
            "content": {
                "application/json": {
                    "example": {
                        "error": "Automation server not found."
                    }
                }
            }
        }
    }
)
class CheckOTPStatusAPIView(APIView):
    """
    Check if OTP has been redeemed - used by web interface
    """
    authentication_classes = [KeycloakAuthentication]

    def get(self, request):
        automation_server_id = request.query_params.get("automation_server_id")
        
        if not automation_server_id:
            return Response(
                {"error": "automation_server_id is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            server = AutomationServer.objects.get(
                automation_server_id=automation_server_id
            )
        except AutomationServer.DoesNotExist:
            return Response(
                {"error": "Automation server not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Check if OTP has been redeemed (access_token exists)
        if server.access_token:
            return Response({
                "redeemed": True,
                "redeemed_at": server.updated_at.isoformat(),
            })
        else:
            # OTP still exists and hasn't been redeemed
            if server.otp:
                return Response({
                    "redeemed": False,
                    "otp": server.otp,
                    "expires_at": server.otp_expires_at.isoformat() if server.otp_expires_at else None,
                })
            else:
                # No OTP exists (shouldn't happen in normal flow)
                return Response({
                    "redeemed": True,
                    "redeemed_at": server.updated_at.isoformat(),
                })
