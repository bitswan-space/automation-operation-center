import json
import logging

from keycloak import KeycloakPostError
from keycloak import KeycloakPutError
from rest_framework import exceptions
from rest_framework import serializers
from rest_framework import status

logger = logging.getLogger(__name__)


class MqttProfileSerializer(serializers.Serializer):
    id = serializers.CharField(required=True)
    name = serializers.CharField(required=True)
    is_admin = serializers.BooleanField(required=True)
    nav_items = serializers.JSONField(required=False)
    group_id = serializers.CharField(required=True)


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
    nav_items = serializers.JSONField(required=False)

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
                    "nav_items": [validated_data.get("nav_items", [])],
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
    tag_color = serializers.CharField(required=False, allow_null=True)
    broker = serializers.UUIDField(required=False)
    description = serializers.CharField(
        required=False,
        allow_blank=True,
        allow_null=True,
    )
    nav_items = serializers.JSONField(required=False, allow_null=True)

    class Meta:
        fields = ["id", "name", "tag_color", "broker", "description", "nav_items"]
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
            nav_items = validated_data.get("nav_items", instance.get("nav_items"))

            # Ensure nav_items is a list
            if nav_items is None:
                nav_items = []

            logger.info("nav_items: %s", nav_items)

            nav_items_str = json.dumps(nav_items or [])

            logger.info("nav_items_str: %s", nav_items_str)

            # Prepare attributes with null handling
            attributes = {
                "tag_color": [tag_color] if tag_color is not None else [],
                "description": [description] if description is not None else [],
                "nav_items": [nav_items_str] if nav_items_str else [],
            }

            # Call the Keycloak API to update the group
            view.update_org_group(
                group_id=group_id,
                name=name,
                attributes=attributes,
            )

            logger.info("Updated UserGroup instance with ID: %s", group_id)

            # Return the updated group details
            updated_group = {
                "id": group_id,
                "name": name,
                "tag_color": tag_color,
                "description": description,
                "nav_items": nav_items,
            }

        except KeycloakPutError as e:
            error_message = None
            try:
                error_message = json.loads(e.error_message).get("errorMessage")
            except (json.JSONDecodeError, AttributeError):
                error_message = str(e)

            logger.exception("Error updating UserGroup: %s", error_message)
            raise exceptions.APIException(
                detail={"error": error_message or "Failed to update user group"},
                code=status.HTTP_400_BAD_REQUEST,
            ) from e

        else:
            return updated_group


class OrgUserSerializeer(serializers.Serializer):
    id = serializers.UUIDField(required=True)
    email = serializers.EmailField(required=True)
    username = serializers.CharField(required=True)
    groups = UserGroupSerializer(required=True, many=True)
    verified = serializers.BooleanField(required=True)
