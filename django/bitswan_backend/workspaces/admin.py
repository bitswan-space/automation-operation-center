from bitswan_backend.workspaces.models import Workspace
from django.contrib import admin


class WorkspaceAdmin(admin.ModelAdmin):
    pass


admin.site.register(Workspace, WorkspaceAdmin)
