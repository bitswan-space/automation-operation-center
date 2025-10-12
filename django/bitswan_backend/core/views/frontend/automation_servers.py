"""
Frontend API views for automation server management
"""
import logging
import uuid

from django.shortcuts import get_object_or_404
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from drf_spectacular.utils import extend_schema, OpenApiParameter
from drf_spectacular.types import OpenApiTypes

from bitswan_backend.core.authentication import KeycloakAuthentication
from bitswan_backend.core.models import AutomationServer, AutomationServerGroupMembership
from bitswan_backend.core.serializers.workspaces_new import (
    AutomationServerSerializer,
    CreateAutomationServerSerializer,
)
from bitswan_backend.core.permissions import IsOrgAdmin
from bitswan_backend.core.viewmixins import KeycloakMixin
from bitswan_backend.core.pagination import DefaultPagination

L = logging.getLogger("core.views.frontend.automation_servers")


@extend_schema(tags=["Frontend API - Automation Servers"])
class AutomationServerViewSet(KeycloakMixin, viewsets.ModelViewSet):
    """
    ViewSet for frontend users to manage automation servers
    ADMIN ONLY: All operations require admin privileges in the organization.
    """
    queryset = AutomationServer.objects.all()
    serializer_class = AutomationServerSerializer
    pagination_class = DefaultPagination
    authentication_classes = [KeycloakAuthentication]
    permission_classes = [IsAuthenticated, IsOrgAdmin]

    def _is_admin_for_automation_server(self, request, automation_server):
        """
        Check if the user is an admin in the same organization as the automation server
        """
        # Get the user's organization from JWT token
        user_org_id = self.get_active_user_org_id()
        
        # Check if the automation server belongs to the same organization
        if automation_server.keycloak_org_id != user_org_id:
            return False
        
        # Check if the user is an admin in that organization
        return self.is_admin(request)

    def get_queryset(self):
        org_id = self.get_active_user_org_id()
        
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
        # Only admin users can create automation servers
        if not self.is_admin(request):
            return Response(
                {"error": "You don't have permission to create automation servers. Only admin users can create automation servers."},
                status=status.HTTP_403_FORBIDDEN,
            )
        
        serializer = CreateAutomationServerSerializer(
            data=request.data,
            context={"view": self, "request": request},
        )

        if serializer.is_valid():
            automation_server = serializer.save()
            return Response(automation_server, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def update(self, request, *args, **kwargs):
        # Only admin users in the same organization can update automation servers
        automation_server = self.get_object()
        if not self._is_admin_for_automation_server(request, automation_server):
            return Response(
                {"error": "You don't have permission to update this automation server. Only admin users in the same organization can update automation servers."},
                status=status.HTTP_403_FORBIDDEN,
            )
        return super().update(request, *args, **kwargs)

    def partial_update(self, request, *args, **kwargs):
        # Only admin users in the same organization can update automation servers
        automation_server = self.get_object()
        if not self._is_admin_for_automation_server(request, automation_server):
            return Response(
                {"error": "You don't have permission to update this automation server. Only admin users in the same organization can update automation servers."},
                status=status.HTTP_403_FORBIDDEN,
            )
        return super().partial_update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        # Only admin users in the same organization can delete automation servers
        automation_server = self.get_object()
        if not self._is_admin_for_automation_server(request, automation_server):
            return Response(
                {"error": "You don't have permission to delete this automation server. Only admin users in the same organization can delete automation servers."},
                status=status.HTTP_403_FORBIDDEN,
            )
        return super().destroy(request, *args, **kwargs)

    @action(detail=True, methods=["POST"], url_path="add_to_group")
    def add_to_group(self, request, pk=None):
        """
        Add automation server to a group by creating a AutomationServerGroupMembership entry
        Only admin users can manage automation server group memberships.
        """
        try:
            automation_server = get_object_or_404(AutomationServer, automation_server_id=pk)
            
            # Only admin users in the same organization can manage automation server group memberships
            if not self._is_admin_for_automation_server(request, automation_server):
                return Response(
                    {"error": "You don't have permission to manage this automation server's group memberships. Only admin users in the same organization can perform this action."},
                    status=status.HTTP_403_FORBIDDEN,
                )
            group_id = request.data.get("group_id")
            
            if not group_id:
                return Response(
                    {"error": "group_id is required"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Check if membership already exists
            existing_membership = AutomationServerGroupMembership.objects.filter(
                automation_server=automation_server,
                keycloak_group_id=group_id
            ).first()
            
            if existing_membership:
                return Response(
                    {"error": "Automation server is already a member of this group"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Create new membership
            AutomationServerGroupMembership.objects.create(
                automation_server=automation_server,
                keycloak_group_id=group_id
            )
            
            return Response(status=status.HTTP_201_CREATED)
        except Exception as e:
            L.error(f"Error adding automation server to group: {str(e)}")
            return Response(
                {"error": "Failed to add automation server to group"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=["POST"], url_path="remove_from_group")
    def remove_from_group(self, request, pk=None):
        """
        Remove automation server from a group by deleting the AutomationServerGroupMembership entry
        Only admin users can manage automation server group memberships.
        """
        try:
            automation_server = get_object_or_404(AutomationServer, automation_server_id=pk)
            
            # Only admin users in the same organization can manage automation server group memberships
            if not self._is_admin_for_automation_server(request, automation_server):
                return Response(
                    {"error": "You don't have permission to manage this automation server's group memberships. Only admin users in the same organization can perform this action."},
                    status=status.HTTP_403_FORBIDDEN,
                )
            group_id = request.data.get("group_id")

            if not group_id:
                return Response(
                    {"error": "group_id is required"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Check if membership exists
            membership = AutomationServerGroupMembership.objects.filter(
                automation_server=automation_server,
                keycloak_group_id=group_id
            ).first()

            if not membership:
                return Response(
                    {"error": "Automation server is not a member of this group"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Delete the membership
            membership.delete()

            return Response(status=status.HTTP_200_OK)
        except Exception as e:
            L.error(f"Error removing automation server from group: {str(e)}")
            return Response(
                {"error": "Failed to remove automation server from group"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=["POST"], url_path="delete")
    def delete_automation_server(self, request, pk=None):
        """
        Delete an automation server after confirming the server name.
        Requires the server name to be provided in the request body for confirmation.
        Only admin users in the automation server's organization can delete it.
        """
        try:
            # Get the automation server
            automation_server = get_object_or_404(AutomationServer, automation_server_id=pk)
            
            # Get the organization that the automation server belongs to
            server_org_id = automation_server.keycloak_org_id
            
            # Get the admin group for that organization
            admin_group = self.keycloak.get_admin_org_group(server_org_id)
            if not admin_group:
                L.error(f"Admin group not found for org {server_org_id}")
                return Response(
                    {"error": "Admin group not found for this organization"}, 
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
            
            # Get the current user ID
            user_id = self.keycloak.get_active_user(request)
            
            # Check if the user is a member of the admin group
            is_admin = self.keycloak.is_group_member(user_id, admin_group["id"])
            
            if not is_admin:
                L.warning(f"User {user_id} is not admin in org {server_org_id} for automation server {pk}")
                return Response(
                    {"error": "You don't have permission to delete this automation server. Only admin users can delete automation servers."}, 
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Delete the automation server
            automation_server.delete()
            
            return Response(
                {"message": "Automation server deleted successfully"}, 
                status=status.HTTP_200_OK
            )
        except Exception as e:
            L.error(f"Error deleting automation server: {str(e)}")
            return Response(
                {"error": "Failed to delete automation server"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


@extend_schema(
    tags=["Frontend API - Automation Servers"],
    summary="Create Automation Server with OTP",
    description="""
    Creates a new automation server and generates a one-time password (OTP) for CLI registration.
    
    **ADMIN ONLY:** This endpoint requires admin privileges in the organization.
    
    This endpoint is used by the web interface when a user wants to connect an automation server.
    The generated OTP must be used within 10 minutes and can only be used once.
    
    **Workflow:**
    1. User clicks "Connect Automation Server" in the web interface
    2. User enters a server name and clicks "Create Server"
    3. This endpoint creates the automation server and returns an OTP
    4. The web interface displays the OTP and CLI command to the user
    5. User runs the CLI command with the OTP on their automation server
    6. CLI exchanges the OTP for an access token using `/api/automation_server/exchange-otp/`
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
                        "otp": "ABC123DEF456GHI789JKL012MNO",
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
        },
        403: {
            "description": "Forbidden - admin privileges required",
            "content": {
                "application/json": {
                    "example": {
                        "error": "You don't have permission to create automation servers. Only admin users can create automation servers."
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
    permission_classes = [IsAuthenticated, IsOrgAdmin]

    def _is_admin_for_automation_server(self, request, automation_server):
        """
        Check if the user is an admin in the same organization as the automation server
        """
        # Get the user's organization from JWT token
        user_org_id = self.get_active_user_org_id()
        
        # Check if the automation server belongs to the same organization
        if automation_server.keycloak_org_id != user_org_id:
            return False
        
        # Check if the user is an admin in that organization
        return self.is_admin(request)

    def post(self, request):
        # Only admin users can create automation servers with OTP
        if not self.is_admin(request):
            return Response(
                {"error": "You don't have permission to create automation servers. Only admin users can create automation servers."},
                status=status.HTTP_403_FORBIDDEN,
            )
        
        name = request.data.get("name")
        if not name:
            return Response(
                {"error": "Server name is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Get the user's organization from JWT token
        org_id = self.get_active_user_org_id()
        
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
    tags=["Frontend API - Automation Servers"],
    summary="Check OTP Redemption Status",
    description="""
    Checks whether an OTP has been redeemed by the CLI.
    
    **ADMIN ONLY:** This endpoint requires admin privileges in the organization.
    
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
                                "otp": "ABC123DEF456GHI789JKL012MNO",
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
        403: {
            "description": "Forbidden - admin privileges required",
            "content": {
                "application/json": {
                    "example": {
                        "error": "You don't have permission to check OTP status. Only admin users can perform this action."
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
class CheckOTPStatusAPIView(KeycloakMixin, APIView):
    """
    Check if OTP has been redeemed - used by web interface
    Only admin users can check OTP status.
    """
    authentication_classes = [KeycloakAuthentication]
    permission_classes = [IsAuthenticated, IsOrgAdmin]

    def _is_admin_for_automation_server(self, request, automation_server):
        """
        Check if the user is an admin in the same organization as the automation server
        """
        # Get the user's organization from JWT token
        user_org_id = self.get_active_user_org_id()
        
        # Check if the automation server belongs to the same organization
        if automation_server.keycloak_org_id != user_org_id:
            return False
        
        # Check if the user is an admin in that organization
        return self.is_admin(request)

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

        # Only admin users in the same organization can check OTP status
        if not self._is_admin_for_automation_server(request, server):
            return Response(
                {"error": "You don't have permission to check OTP status for this automation server. Only admin users in the same organization can perform this action."},
                status=status.HTTP_403_FORBIDDEN,
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