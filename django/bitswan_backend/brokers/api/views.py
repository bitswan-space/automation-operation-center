import json

from keycloak import KeycloakDeleteError
from keycloak import KeycloakGetError
from keycloak import KeycloakPostError
from keycloak import KeycloakPutError
from rest_framework import status
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from bitswan_backend.brokers.api.serializers import CreateUserGroupSerializer
from bitswan_backend.brokers.api.serializers import MqttProfileSerializer
from bitswan_backend.brokers.api.serializers import OrgUserSerializeer
from bitswan_backend.brokers.api.serializers import UpdateUserGroupSerializer
from bitswan_backend.brokers.api.serializers import UserGroupSerializer
from bitswan_backend.brokers.api.service import GroupNavigationService
from bitswan_backend.core.pagination import DefaultPagination
from bitswan_backend.core.viewmixins import KeycloakMixin


class UserGroupViewSet(KeycloakMixin, viewsets.ViewSet):
    pagination_class = DefaultPagination
    group_nav_service = GroupNavigationService()

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
            self.delete_org_group(group_id=pk)
            return Response(status=status.HTTP_204_NO_CONTENT)
        except KeycloakDeleteError as e:
            return Response(
                {"error": json.loads(e.error_message).get("errorMessage")},
                status=status.HTTP_400_BAD_REQUEST,
            )

    def update(self, request, pk=None):
        existing_group = self.get_org_group(pk)

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

    @action(detail=False, methods=["get"])
    def mqtt_profiles(self, request):
        try:
            mqtt_profiles = self.get_org_group_mqtt_profiles()

            for profile in mqtt_profiles:
                profile["nav_items"] = self.group_nav_service.get_or_create_navigation(
                    group_id=profile["group_id"],
                ).nav_items

            paginator = self.pagination_class()
            paginated_mqtt_profiles = paginator.paginate_queryset(
                mqtt_profiles,
                request,
            )
            serializer = MqttProfileSerializer(paginated_mqtt_profiles, many=True)

            return paginator.get_paginated_response(serializer.data)
        except KeycloakGetError as e:
            e.add_note("Error while getting mqtt profiles.")
            return Response(
                {"error": json.loads(e.error_message).get("errorMessage")},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class OrgUsersViewSet(KeycloakMixin, viewsets.ViewSet):
    pagination_class = DefaultPagination

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

    @action(detail=False, methods=["post"])
    def invite(self, request):
        try:
            email = request.data.get("email")

            self.invite_user_to_org(email=email)
            return Response(status=status.HTTP_201_CREATED)
        except (KeycloakPostError, KeycloakPutError) as e:
            e.add_note("Error while inviting user to org.")
            return Response(
                {"error": json.loads(e.error_message).get("errorMessage")},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
