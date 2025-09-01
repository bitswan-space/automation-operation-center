import uuid

from django.db import models
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver


class Workspace(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    keycloak_org_id = models.CharField(max_length=255, null=False, blank=False)
    automation_server = models.ForeignKey(
        "AutomationServer",
        on_delete=models.CASCADE,
        to_field="automation_server_id",
        related_name="workspaces",
        null=False,
        blank=False,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    editor_url = models.CharField(max_length=255, null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name


class WorkspaceGroupMembership(models.Model):
    id = models.AutoField(primary_key=True)
    workspace = models.ForeignKey(
        "Workspace",
        on_delete=models.CASCADE,
        related_name="group_memberships",
        null=False,
        blank=False,
    )
    keycloak_group_id = models.CharField(max_length=255)


# Signal handlers for MQTT publishing
@receiver([post_save, post_delete], sender=WorkspaceGroupMembership)
def publish_workspace_groups_on_change(sender, instance, **kwargs):
    """
    Automatically publish workspace groups to MQTT when memberships change
    """
    try:
        from bitswan_backend.core.mqtt import MQTTService

        MQTTService().publish_workspace_groups(instance.workspace)
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.warning(f"Failed to publish workspace groups to MQTT: {e}")
