from django.apps import AppConfig


class GroupsConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "bitswan_backend.groups"

    def ready(self):
        from bitswan_backend.core.mqtt import MQTTService
        mqtt_service = MQTTService()
        mqtt_service.publish_all_groups()
