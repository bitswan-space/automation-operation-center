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

@receiver([post_save], sender=Workspace)
def create_workspace_editor_group(sender, instance, created, **kwargs):
    """
    Create workspace editor group for the workspace
    """
    if not created:
        return
    
    try:
        from bitswan_backend.core.services.keycloak import KeycloakService
        
        keycloak_service = KeycloakService()
        workspace_name = instance.name
        
        # Create editor group
        editor_group_id = keycloak_service.create_group(
            org_id=instance.keycloak_org_id,
            name=f"{workspace_name}-editor",
            attributes={
                "tag_color": ["#F44336"],  # Red color for editor
                "description": [f"Editor access to workspace {workspace_name}"],
                "permissions": ["workspace-editor"],
            }
        )
        
        # Store group membership in the database
        WorkspaceGroupMembership.objects.create(
            workspace=instance,
            keycloak_group_id=editor_group_id
        )
        
        import logging
        logger = logging.getLogger(__name__)
        logger.info(f"Created workspace group for {workspace_name}: {editor_group_id}")
        
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Failed to create workspace groups for {instance.name}: {e}")
