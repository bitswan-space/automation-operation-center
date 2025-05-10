from rest_framework import serializers

from bitswan_backend.workspaces.models import AutomationServer
from bitswan_backend.workspaces.models import Workspace


class WorkspaceSerializer(serializers.ModelSerializer):
    automation_server_id = serializers.SlugRelatedField(
        source="automation_server",
        slug_field="automation_server_id",
        queryset=AutomationServer.objects.all(),
        write_only=True,
    )
    # Display the automation server's ID (external ID) in a readable way
    automation_server = serializers.SlugRelatedField(
        slug_field="automation_server_id",
        read_only=True,
    )

    class Meta:
        model = Workspace
        fields = [
            "id",
            "name",
            "keycloak_org_id",
            "automation_server",
            "automation_server_id",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["created_at", "updated_at"]


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
