import logging

from rest_framework import serializers

logger = logging.getLogger("core.serializers.mqtt_profiles")


class MqttProfileSerializer(serializers.Serializer):
    id = serializers.CharField(required=True)
    name = serializers.CharField(required=True)
    is_admin = serializers.BooleanField(required=True)
    nav_items = serializers.JSONField(required=False)
    group_id = serializers.CharField(required=True)
