from rest_framework import serializers

from bitswan_backend.core.models import AutomationServer
from bitswan_backend.core.models import Workspace
from bitswan_backend.core.models.workspaces import WorkspaceGroupMembership


class WorkspaceGroupMembershipSerializer(serializers.ModelSerializer):
    """Serializer for WorkspaceGroupMembership model"""
    
    class Meta:
        model = WorkspaceGroupMembership
        fields = [
            "id",
            "keycloak_group_id",
        ]


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
    keycloak_org_id = serializers.CharField(read_only=True)
    
    group_memberships = WorkspaceGroupMembershipSerializer(many=True, read_only=True)

    def validate(self, attrs):
        if not attrs.get("automation_server"):
            message = "Automation server not found for workspace."
            raise serializers.ValidationError(message)

        return attrs

    def create(self, validated_data):
        automation_server = validated_data.get("automation_server")
        return Workspace.objects.create(
            **validated_data,
            keycloak_org_id=automation_server.keycloak_org_id,
        )

    class Meta:
        model = Workspace
        fields = [
            "id",
            "name",
            "keycloak_org_id",
            "automation_server",
            "automation_server_id",
            "editor_url",
            "created_at",
            "updated_at",
            "group_memberships",
        ]
        read_only_fields = ["created_at", "updated_at", "keycloak_org_id"]
