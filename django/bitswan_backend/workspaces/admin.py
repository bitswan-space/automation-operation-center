from django.contrib import admin

from bitswan_backend.core.models import AutomationServer
from bitswan_backend.core.models import Workspace
from bitswan_backend.core.models import WorkspaceGroupMembership
from bitswan_backend.core.models.automation_server import AutomationServerGroupMembership


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


@admin.register(AutomationServerGroupMembership)
class AutomationServerGroupMembershipAdmin(admin.ModelAdmin):
    list_display = ['id', 'automation_server', 'keycloak_group_id']
    list_filter = ['automation_server__name']
    search_fields = ['automation_server__name', 'keycloak_group_id']
    readonly_fields = ['id']
