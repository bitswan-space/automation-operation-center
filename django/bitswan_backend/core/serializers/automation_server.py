import uuid

from rest_framework import serializers

from bitswan_backend.core.serializers.workspaces import WorkspaceSerializer
from bitswan_backend.core.services.keycloak import KeycloakService
from bitswan_backend.workspaces.models import AutomationServer


class AutomationServerSerializer(serializers.ModelSerializer):
    workspaces = WorkspaceSerializer(many=True, read_only=True)

    class Meta:
        model = AutomationServer
        fields = [
            "id",
            "name",
            "automation_server_id",
            "keycloak_org_id",
            "workspaces",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "created_at",
            "updated_at",
        ]


class CreateAutomationServerSerializer(serializers.ModelSerializer):
    class Meta:
        model = AutomationServer
        fields = [
            "name",
            "keycloak_org_id",
        ]

    def validate(self, attrs):
        automation_server = AutomationServer.objects.filter(
            name=attrs.get("name"),
            keycloak_org_id=attrs.get("keycloak_org_id"),
        ).first()
        if automation_server:
            message = "Automation server already exists."
            raise serializers.ValidationError(message)

        keycloak_service = KeycloakService()

        request = self.context.get("request")

        user_orgs = keycloak_service.get_active_user_orgs(request)
        user_org_ids = [org.get("id") for org in user_orgs]

        if attrs.get("keycloak_org_id") not in user_org_ids:
            message = "User does not have access to this organization."
            raise serializers.ValidationError(message)

        return attrs

    def create(self, validated_data):
        server = AutomationServer.objects.create(
            name=validated_data.get("name"),
            automation_server_id=uuid.uuid4(),
            keycloak_org_id=validated_data.get("keycloak_org_id"),
        )

        return {
            "automation_server_id": server.automation_server_id,
        }
