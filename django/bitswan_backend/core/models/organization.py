from django.db import models


class GroupNavigation(models.Model):
    id = models.AutoField(primary_key=True)
    group_id = models.CharField(max_length=255, unique=True)
    nav_items = models.JSONField(default=list)

    def __str__(self):
        return f"Navigation for Group {self.group_id}"
