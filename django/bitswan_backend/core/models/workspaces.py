import uuid

from django.db import models


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
