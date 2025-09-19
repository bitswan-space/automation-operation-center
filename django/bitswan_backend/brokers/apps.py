from django.apps import AppConfig


class BrokersConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "bitswan_backend.brokers"

    def ready(self):
        from bitswan_backend.core.mqtt import MQTTService
        mqtt_service = MQTTService()
        mqtt_service.publish_all_groups()
