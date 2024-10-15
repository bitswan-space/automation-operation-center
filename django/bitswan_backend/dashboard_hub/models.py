from uuid import uuid4

from django.db import models


class DashboardEntry(models.Model):
    id = models.UUIDField(default=uuid4, editable=False, unique=True, primary_key=True)
    name = models.CharField(max_length=100, blank=False, null=False, unique=True)
    url = models.URLField(max_length=200, blank=False, null=False)
    description = models.TextField(blank=True)
    keycloak_group_id = models.CharField(max_length=100, null=False, blank=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name()
