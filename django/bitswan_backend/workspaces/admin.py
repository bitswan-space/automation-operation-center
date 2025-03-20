from django.contrib import admin

from bitswan_backend.workspaces.models import AutomationServer
from bitswan_backend.workspaces.models import Workspace


@admin.register(Workspace)
class WorkspaceAdmin(admin.ModelAdmin):
    pass


@admin.register(AutomationServer)
class AutomationServerAdmin(admin.ModelAdmin):
    pass
