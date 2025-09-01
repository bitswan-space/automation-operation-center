from django.db import models
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver


class AutomationServer(models.Model):
    id = models.AutoField(primary_key=True)
    automation_server_id = models.CharField(
        max_length=255,
        null=False,
        blank=False,
        unique=True,
    )
    name = models.CharField(max_length=255)
    keycloak_org_id = models.CharField(max_length=255, null=False, blank=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name


class AutomationServerGroupMembership(models.Model):
    id = models.AutoField(primary_key=True)
    automation_server = models.ForeignKey(
        "AutomationServer",
        on_delete=models.CASCADE,
        related_name="group_memberships",
        null=False,
        blank=False,
    )
    keycloak_group_id = models.CharField(max_length=255)


# Signal handlers for MQTT publishing
@receiver([post_save, post_delete], sender=AutomationServerGroupMembership)
def publish_automation_server_groups_on_change(sender, instance, **kwargs):
    """
    Automatically publish automation server groups to MQTT when memberships change
    """
    try:
        from bitswan_backend.core.mqtt import MQTTService

        MQTTService().publish_automation_server_groups(instance.automation_server)
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.warning(f"Failed to publish automation server groups to MQTT: {e}")
