from django.contrib import admin

from bitswan_backend.core.models import AutomationServer
from bitswan_backend.core.models import Workspace


@admin.register(Workspace)
class WorkspaceAdmin(admin.ModelAdmin):
    pass


@admin.register(AutomationServer)
class AutomationServerAdmin(admin.ModelAdmin):
    pass
