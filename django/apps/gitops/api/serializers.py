from rest_framework import serializers

from apps.gitops.models import Brokers
from apps.gitops.models import Gitops


class GitopsSerializer(serializers.ModelSerializer):
    class Meta:
        model = Gitops
        fields = [
            "id",
            "name",
            "secret_key",
            "keycloak_group_id",
            "created_at",
            "updated_at",
        ]


class BrokerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Brokers
        fields = [
            "id",
            "url",
            "username",
            "password",
            "keycloak_group_id",
            "created_at",
            "updated_at",
        ]


class PipelineEditorStartSerializer(serializers.Serializer):
    secret_key = serializers.CharField()
    deployment_id = serializers.CharField()
