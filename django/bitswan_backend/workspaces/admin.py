from django.contrib import admin

from bitswan_backend.core.models import AutomationServer
from bitswan_backend.core.models import Workspace
from bitswan_backend.core.models import WorkspaceGroupMembership


@admin.register(Workspace)
class WorkspaceAdmin(admin.ModelAdmin):
    pass


@admin.register(AutomationServer)
class AutomationServerAdmin(admin.ModelAdmin):
    pass


@admin.register(WorkspaceGroupMembership)
class WorkspaceGroupMembershipAdmin(admin.ModelAdmin):
    list_display = ['id', 'workspace', 'keycloak_group_id']
    list_filter = ['workspace__name']
    search_fields = ['workspace__name', 'keycloak_group_id']
    readonly_fields = ['id']
