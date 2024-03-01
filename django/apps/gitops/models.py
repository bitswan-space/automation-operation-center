from uuid import uuid4

from django.db import models


class Gitops(models.Model):
    id = models.UUIDField(default=uuid4, editable=False, unique=True, primary_key=True)
    secret_key = models.CharField(max_length=100, blank=False, null=False)
    name = models.CharField(max_length=100, blank=False, null=False, unique=True)
    keycloak_group_id = models.CharField(max_length=100, null=False, blank=False)
    keycloak_group_slug = models.SlugField(max_length=100, null=False, blank=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name()


class Brokers(models.Model):
    id = models.UUIDField(default=uuid4, editable=False, unique=True, primary_key=True)
    url = models.URLField(blank=False, null=False)
    username = models.CharField(max_length=100, blank=False, null=False)
    password = models.CharField(max_length=100, blank=True)
    keycloak_group_id = models.CharField(max_length=100, null=False, blank=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.url
