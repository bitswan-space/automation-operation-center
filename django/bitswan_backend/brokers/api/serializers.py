import json
import logging

from keycloak import KeycloakPostError
from keycloak import KeycloakPutError
from rest_framework import exceptions
from rest_framework import serializers

logger = logging.getLogger(__name__)


class MqttProfileSerializer(serializers.Serializer):
    id = serializers.CharField(required=True)
    name = serializers.CharField(required=True)
    is_admin = serializers.BooleanField(required=True)


class UserGroupSerializer(serializers.Serializer):
    id = serializers.UUIDField(required=True)
    name = serializers.CharField(required=True)
    tag_color = serializers.CharField(required=False)
    description = serializers.CharField(required=False)
    active = serializers.BooleanField(required=False)


class CreateUserGroupSerializer(serializers.Serializer):
    id = serializers.UUIDField(required=False)
    name = serializers.CharField(required=True)
    tag_color = serializers.CharField(required=False)
    description = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        fields = ["id", "name", "tag_color", "description"]
        read_only_fields = ["id"]

    def create(self, validated_data):
        logger.info("Creating new UserGroup instance.")

        view = self.context["view"]

        try:
            keycloak_group_id = view.create_org_group(
                name=validated_data.get("name"),
                attributes={
                    "tag_color": [validated_data.get("tag_color")],
                    "description": [validated_data.get("description")],
                },
            )

            logger.info("Created new UserGroup instance: %s", keycloak_group_id)

            keycloak_group = {
                "name": validated_data.get("name"),
                "id": keycloak_group_id,
                "tag_color": validated_data.get("tag_color"),
                "description": validated_data.get("description"),
            }

        except KeycloakPostError as e:
            e.add_note("Error while creating new UserGroup.")
            raise exceptions.APIException(
                detail={
                    "error": json.loads(e.error_message).get("errorMessage"),
                },
            ) from e

        return keycloak_group


class UpdateUserGroupSerializer(serializers.Serializer):
    id = serializers.UUIDField(required=True)
    name = serializers.CharField(required=False)
    tag_color = serializers.CharField(required=False)
    broker = serializers.UUIDField(required=False)
    description = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        fields = ["id", "name", "tag_color", "broker", "description"]
        read_only_fields = ["id"]

    def update(self, instance, validated_data):
        logger.info("Updating UserGroup instance.")

        view = self.context["view"]
        group_id = str(instance["id"])

        try:
            # Extract fields, defaulting to the existing instance values
            name = validated_data.get("name", instance["name"])
            tag_color = validated_data.get("tag_color", instance.get("tag_color"))
            description = validated_data.get("description", instance.get("description"))

            # Call the Keycloak API to update the group
            view.update_org_group(
                group_id=group_id,
                name=name,
                attributes={
                    "tag_color": [tag_color],
                    "description": [description],
                },
            )

            logger.info("Updated UserGroup instance with ID: %s", group_id)

            # Return the updated group details
            updated_group = {
                "id": group_id,
                "name": name,
                "tag_color": tag_color,
                "description": description,
            }

        except KeycloakPutError as e:
            e.add_note("Error while updating UserGroup instance.")
            raise exceptions.APIException(
                detail={
                    "error": json.loads(e.error_message).get("errorMessage"),
                },
            ) from e

        return updated_group


class OrgUserSerializeer(serializers.Serializer):
    id = serializers.UUIDField(required=True)
    email = serializers.EmailField(required=True)
    username = serializers.CharField(required=True)
    groups = UserGroupSerializer(required=True, many=True)
    verified = serializers.BooleanField(required=True)
