"""
Frontend API views for group and user management
"""
import json
import logging

from keycloak import KeycloakDeleteError
from keycloak import KeycloakGetError
from keycloak import KeycloakPostError
from keycloak import KeycloakPutError
from rest_framework import status
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from bitswan_backend.core.authentication import KeycloakAuthentication
from bitswan_backend.core.viewmixins import KeycloakMixin
from bitswan_backend.core.serializers.groups import CreateOrgSerializer
from bitswan_backend.core.serializers.groups import CreateUserGroupSerializer
from bitswan_backend.core.serializers.groups import OrgSerializer
from bitswan_backend.core.serializers.groups import OrgUserSerializeer
from bitswan_backend.core.serializers.groups import UpdateUserGroupSerializer
from bitswan_backend.core.serializers.groups import UserGroupSerializer
from bitswan_backend.core.serializers.groups import ProfileSerializer
from bitswan_backend.core.managers.organization import GroupNavigationService
from bitswan_backend.core.pagination import DefaultPagination
from bitswan_backend.core.permissions import IsOrgAdmin
from bitswan_backend.core.models.workspaces import WorkspaceGroupMembership
from bitswan_backend.core.models.automation_server import AutomationServerGroupMembership

logger = logging.getLogger(__name__)


class UserGroupViewSet(KeycloakMixin, viewsets.ViewSet):
    pagination_class = DefaultPagination
    group_nav_service = GroupNavigationService()
    authentication_classes = [KeycloakAuthentication]
    permission_classes = [IsAuthenticated, IsOrgAdmin]

    def list(self, request):
        try:
            groups = self.get_org_groups()
            paginator = self.pagination_class()
            paginated_groups = paginator.paginate_queryset(groups, request)
            serializer = UserGroupSerializer(paginated_groups, many=True)

            return paginator.get_paginated_response(serializer.data)
        except KeycloakGetError as e:
            e.add_note("Error while getting org groups.")
            return Response(
                {"error": json.loads(e.error_message).get("errorMessage")},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    def create(self, request):
        self.org_id = self.get_org_id()

        serializer = CreateUserGroupSerializer(
            data=request.data,
            context={"view": self},
        )

        if serializer.is_valid():
            group = serializer.save()
            return Response(group, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def destroy(self, request, pk=None):
        try:
            admin_group = self.keycloak.get_admin_org_group(self.get_org_id())
        
            if admin_group["id"] == pk:
                return Response(
                    {"error": "Admin group cannot be deleted."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            
            self.delete_org_group(group_id=pk)
            
            WorkspaceGroupMembership.objects.filter(keycloak_group_id=pk).delete()
            AutomationServerGroupMembership.objects.filter(keycloak_group_id=pk).delete()
            
            return Response(status=status.HTTP_204_NO_CONTENT)
        except KeycloakDeleteError as e:
            return Response(
                {"error": json.loads(e.error_message).get("errorMessage")},
                status=status.HTTP_400_BAD_REQUEST,
            )

    def update(self, request, pk=None):
        existing_group = self.get_org_group(pk)
        
        admin_group = self.keycloak.get_admin_org_group(self.get_org_id())
        
        if admin_group["id"] == pk and request.data.get("name") != admin_group["name"]:
            return Response(
                {"error": "Admin group name cannot be updated."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        navigation = self.group_nav_service.get_or_create_navigation(group_id=pk)

        existing_group["nav_items"] = navigation.nav_items

        if not existing_group:
            return Response(
                {"error": "Group not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Use the UpdateUserGroupSerializer for the update operation
        serializer = UpdateUserGroupSerializer(
            instance=existing_group,
            data=request.data,
            context={"view": self},
            partial=True,
        )
        serializer.is_valid(raise_exception=True)

        updated_group = serializer.save()
        return Response(updated_group, status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"])
    def add_member(self, request, pk=None):
        try:
            group_id = pk
            user_id = request.data.get("user_id")

            self.add_user_to_group(group_id=group_id, user_id=user_id)
            return Response(status=status.HTTP_200_OK)
        except KeycloakPutError as e:
            e.add_note("Error while adding user to group.")
            return Response(
                {"error": json.loads(e.error_message).get("errorMessage")},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    @action(detail=True, methods=["post"])
    def remove_member(self, request, pk=None):
        try:
            group_id = pk
            user_id = request.data.get("user_id")

            self.remove_user_from_group(group_id=group_id, user_id=user_id)
            return Response(status=status.HTTP_200_OK)
        except KeycloakDeleteError as e:
            e.add_note("Error while removing user from group.")
            return Response(
                {"error": json.loads(e.error_message).get("errorMessage")},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class ProfileViewSet(KeycloakMixin, viewsets.ViewSet):
    pagination_class = DefaultPagination
    group_nav_service = GroupNavigationService()
    authentication_classes = [KeycloakAuthentication]
    permission_classes = [IsAuthenticated]

    def list(self, request):
        try:
            profiles = []

            # Return all groups if user is admin
            if self.is_admin(request):
                groups = self.get_org_groups()
                profiles = [
                    {
                        "id": group["id"],
                        "name": group["name"],
                        "nav_items": self.group_nav_service.get_nav_items(group["id"]),
                    } for group in groups
                ]

            else:
                groups = self.get_user_org_groups()
                merged_nav_items = []
                for group in groups:
                    nav_items = self.group_nav_service.get_nav_items(group["id"])
                    merged_nav_items.extend(nav_items)
                profiles = [
                    {
                        "id": "merged",
                        "name": "merged",
                        "nav_items": merged_nav_items,
                    }
                ]

            paginator = self.pagination_class()
            paginated_profiles = paginator.paginate_queryset(
                profiles,
                request,
            )
            serializer = ProfileSerializer(paginated_profiles, many=True)

            return paginator.get_paginated_response(serializer.data)
        except KeycloakGetError as e:
            e.add_note("Error while getting profiles.")
            return Response(
                {"error": json.loads(e.error_message).get("errorMessage")},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class OrgUsersViewSet(KeycloakMixin, viewsets.ViewSet):
    pagination_class = DefaultPagination
    authentication_classes = [KeycloakAuthentication]
    permission_classes = [IsAuthenticated, IsOrgAdmin]

    def list(self, request):
        try:
            users = self.get_org_users()

            paginator = self.pagination_class()
            paginated_users = paginator.paginate_queryset(users, request)
            serializer = OrgUserSerializeer(paginated_users, many=True)

            return paginator.get_paginated_response(serializer.data)
        except KeycloakGetError as e:
            e.add_note("Error while getting org users.")
            return Response(
                {"error": json.loads(e.error_message).get("errorMessage")},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    def destroy(self, request, pk=None):
        try:
            self.delete_user(user_id=pk)
            return Response(status=status.HTTP_204_NO_CONTENT)
        except KeycloakDeleteError as e:
            e.add_note("Error while deleting user.")
            return Response(
                {"error": json.loads(e.error_message).get("errorMessage")},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    @action(methods=["get"], detail=True)
    def non_member_groups(self, request, pk=None):
        try:
            user_groups = self.get_user_org_groups(user_id=pk)
            org_groups = self.get_org_groups()
            user_group_ids = {group["id"] for group in user_groups}
            non_member_groups = [group for group in org_groups if group["id"] not in user_group_ids]
            paginator = self.pagination_class()
            paginated_groups = paginator.paginate_queryset(non_member_groups, request)
            serializer = UserGroupSerializer(paginated_groups, many=True)

            return paginator.get_paginated_response(serializer.data)
        except KeycloakGetError as e:
            e.add_note("Error while getting non-member groups.")
            return Response(
                {"error": json.loads(e.error_message).get("errorMessage")},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    @action(detail=False, methods=["post"])
    def invite(self, request):
        try:
            email = request.data.get("email")

            invitation_result = self.invite_user_to_org(email=email)
            
            if invitation_result["success"]:
                return Response(
                    {
                        "success": True,
                        "email_sent": invitation_result["email_sent"],
                        "temporary_password": invitation_result["temporary_password"],
                        "message": "User invited successfully"
                    },
                    status=status.HTTP_201_CREATED
                )
            else:
                return Response(
                    {"error": "Failed to invite user"},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                )
        except (KeycloakPostError, KeycloakPutError) as e:
            e.add_note("Error while inviting user to org.")
            return Response(
                {"error": json.loads(e.error_message).get("errorMessage")},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
        except PermissionDenied as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_403_FORBIDDEN,
            )
        except Exception as e:
            logger.exception("Unexpected error while inviting user to org")
            return Response(
                {"error": "An unexpected error occurred while inviting the user"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class OrgViewSet(KeycloakMixin, viewsets.ViewSet):
    pagination_class = DefaultPagination
    authentication_classes = [KeycloakAuthentication]
    permission_classes = [IsAuthenticated]

    def list(self, request):
        try:
            orgs = self.get_active_user_orgs()
            paginator = self.pagination_class()
            paginated_orgs = paginator.paginate_queryset(orgs, request)
            serializer = OrgSerializer(paginated_orgs, many=True)
            return paginator.get_paginated_response(serializer.data)
        except KeycloakGetError as e:
            e.add_note("Error while getting orgs.")
            return Response(
                {"error": json.loads(e.error_message).get("errorMessage")},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    def create(self, request):

        serializer = CreateOrgSerializer(
            data=request.data,
            context={"view": self},
        )

        if serializer.is_valid():
            group = serializer.save()
            return Response(group, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def retrieve(self, request, pk=None):
        try:
            orgs = self.get_active_user_orgs()
            org = next((org for org in orgs if org["id"] == pk), None)
            if not org:
                return Response(
                    {"error": "Org not found."},
                    status=status.HTTP_404_NOT_FOUND,
                )
            serializer = OrgSerializer(org)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            logger.exception("Error while getting org: %s", str(e))
            return Response(
                {"error": "An unexpected error occurred while getting the org."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
