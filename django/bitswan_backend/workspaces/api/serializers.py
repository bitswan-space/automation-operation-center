from rest_framework import serializers

from bitswan_backend.workspaces.models import Workspace


class WorkspaceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Workspace
        fields = [
            "id",
            "name",
            "keycloak_group_id",
            "automation_server_id",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "created_at",
            "updated_at",
        ]
