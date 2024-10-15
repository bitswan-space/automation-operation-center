import logging

from rest_framework import serializers

from bitswan_backend.core.utils.secrets import generate_secret
from bitswan_backend.gitops.models import Gitops

logger = logging.getLogger(__name__)


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
        read_only_fields = [
            "secret_key",
            "created_at",
            "updated_at",
        ]

    def create(self, validated_data):
        logger.info("Creating new Gitops instance.")
        secret_key = generate_secret()

        return Gitops.objects.create(secret_key=secret_key, **validated_data)
