import json
import logging
import os

from django.conf import settings
from keycloak import KeycloakGetError
from rest_framework import status
from rest_framework import views
from rest_framework.response import Response

from bitswan_backend.core.authentication import KeycloakAuthentication
from bitswan_backend.core.permissions.emqx import CanReadProfileEMQXJWT
from bitswan_backend.core.serializers.mqtt_profiles import MqttProfileSerializer
from bitswan_backend.core.utils.mqtt import create_mqtt_token
from bitswan_backend.core.viewmixins import KeycloakMixin

L = logging.getLogger("core.views.mqtt_profiles")


# todo: create a url for this
class MqttProfilesAPIView(KeycloakMixin, views.APIView):
    authentication_classes = [KeycloakAuthentication]
    permission_classes = [CanReadProfileEMQXJWT]

    def get(self, request):
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


class GetProfileEmqxJWTAPIView(KeycloakMixin, views.APIView):
    authentication_classes = [KeycloakAuthentication]
    permission_classes = [CanReadProfileEMQXJWT]

    def get(self, request, profile_id):
        org_id = self.get_org_id()
        is_admin = self.is_admin(request)

        profile_id = f"{org_id}_group_{profile_id}{'_admin' if is_admin else ''}"

        mountpoint = f"/orgs/{org_id}/profiles/{profile_id}"
        username = profile_id

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


class GetProfileManagerEmqxJWTAPIView(KeycloakMixin, views.APIView):
    authentication_classes = [KeycloakAuthentication]

    def get(self, request):
        token = create_mqtt_token(
            secret=settings.EMQX_JWT_SECRET,
            username="root",
        )

        return Response(
            {
                "url": os.getenv("EMQX_EXTERNAL_URL"),
                "token": token,
            },
            status=status.HTTP_200_OK,
        )
