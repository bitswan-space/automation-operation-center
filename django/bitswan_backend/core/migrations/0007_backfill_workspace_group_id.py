# Generated migration to add workspace_group_id field and backfill it for existing workspaces

from django.db import migrations, models


def backfill_workspace_group_id(apps, schema_editor):
    """
    Backfill workspace_group_id for existing workspaces that don't have it set.
    Uses the first WorkspaceGroupMembership as the fallback.
    """
    Workspace = apps.get_model('core', 'Workspace')
    WorkspaceGroupMembership = apps.get_model('core', 'WorkspaceGroupMembership')
    
    workspaces_without_group_id = Workspace.objects.filter(
        workspace_group_id__isnull=True
    ) | Workspace.objects.filter(workspace_group_id='')
    
    updated_count = 0
    for workspace in workspaces_without_group_id:
        # Get the first group membership for this workspace
        first_membership = WorkspaceGroupMembership.objects.filter(
            workspace=workspace
        ).first()
        
        if first_membership:
            workspace.workspace_group_id = first_membership.keycloak_group_id
            workspace.save(update_fields=['workspace_group_id'])
            updated_count += 1
    
    print(f"Backfilled workspace_group_id for {updated_count} workspaces")


def reverse_backfill(apps, schema_editor):
    """
    Reverse migration - this is a no-op since we're just backfilling data
    """
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0006_workspace_keycloak_internal_client_id'),
    ]

    operations = [
        # First, add the field
        migrations.AddField(
            model_name='workspace',
            name='workspace_group_id',
            field=models.CharField(blank=True, max_length=255, null=True),
        ),
        # Then, backfill the data
        migrations.RunPython(backfill_workspace_group_id, reverse_backfill),
    ]
