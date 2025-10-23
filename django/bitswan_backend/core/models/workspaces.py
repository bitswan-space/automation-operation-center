import uuid

from django.db import models
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from bitswan_backend.core.services.keycloak import KeycloakService

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
    keycloak_internal_client_id = models.CharField(max_length=255, null=True, blank=True)
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

@receiver([post_save], sender=Workspace)
def create_workspace_keycloak_client(sender, instance, created, **kwargs):
    """
    Create workspace keycloak client for the workspace
    """
    if not created:
        return
    
    try:
        import logging
        logger = logging.getLogger(__name__)
        keycloak_service = KeycloakService()
        workspace_name = instance.name
        workspace_id = str(instance.id)
        editor_url = instance.editor_url
        if not editor_url:
            logger.warning("No editor URL found for workspace %s, skipping creation of Keycloak client", workspace_name)
            return
        result = keycloak_service.create_workspace_client(workspace_id, editor_url)
        
        # Store the Keycloak internal ID for efficient secret retrieval
        if result and result.get("success") and result.get("keycloak_internal_client_id"):            
            instance.keycloak_internal_client_id = result["keycloak_internal_client_id"]
            instance.save(update_fields=['keycloak_internal_client_id'])
            logger.info("Successfully created and stored Keycloak client for workspace %s", workspace_name)
        else:
            logger.warning("Failed to create Keycloak client for workspace %s: %s", workspace_name, result.get("error", "Unknown error"))
            
    except Exception as e:
        logger.error("Error creating Keycloak client for workspace %s: %s", instance.name, e)
  
@receiver([post_delete], sender=Workspace)
def delete_workspace_keycloak_client(sender, instance, **kwargs):
    """
    Delete workspace keycloak client for the workspace
    """
    try:
        import logging
        logger = logging.getLogger(__name__)
        if instance.keycloak_internal_client_id:
            keycloak_service = KeycloakService()
            keycloak_service.delete_workspace_client(instance.keycloak_internal_client_id)
            logger.info("Successfully deleted Keycloak client for workspace %s", instance.name)
        else:
            logger.warning("No Keycloak internal client ID found for workspace %s, skipping deletion", instance.name)
    except Exception as e:
        logger.error("Error deleting Keycloak client for workspace %s: %s", instance.name, e)
    
