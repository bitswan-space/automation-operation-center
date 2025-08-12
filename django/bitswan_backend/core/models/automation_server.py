from django.db import models


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
