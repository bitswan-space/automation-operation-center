from rest_framework import serializers

from bitswan_backend.brokers.models import Brokers


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
