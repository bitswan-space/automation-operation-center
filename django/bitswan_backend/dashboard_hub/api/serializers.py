import logging

from rest_framework import serializers

from bitswan_backend.dashboard_hub.models import DashboardEntry

logger = logging.getLogger(__name__)


class DashboardEntrySerializer(serializers.ModelSerializer):
    class Meta:
        model = DashboardEntry
        fields = [
            "id",
            "name",
            "url",
            "description",
            "keycloak_group_id",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "keycloak_group_id",
            "created_at",
            "updated_at",
        ]

    def create(self, validated_data):
        logging.info("Creating new Dashboard Entry instance.")

        return DashboardEntry.objects.create(**validated_data)
