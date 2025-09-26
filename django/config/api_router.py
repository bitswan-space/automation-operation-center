from django.conf import settings
from rest_framework.routers import DefaultRouter
from rest_framework.routers import SimpleRouter

from bitswan_backend.core.views.groups import OrgUsersViewSet
from bitswan_backend.core.views.groups import OrgViewSet
from bitswan_backend.core.views.groups import UserGroupViewSet
from bitswan_backend.users.api.views import UserViewSet
from bitswan_backend.core.views.workspaces import AutomationServerViewSet
from bitswan_backend.core.views.workspaces import WorkspaceViewSet
from bitswan_backend.core.urls.workspaces import urlpatterns as workspaces_urlpatterns

router = DefaultRouter() if settings.DEBUG else SimpleRouter()

router.register("users", UserViewSet)

router.register("user-groups", UserGroupViewSet, basename="user-groups")
router.register("org-users", OrgUsersViewSet, basename="org-users")
router.register("orgs", OrgViewSet, basename="orgs")
router.register("workspaces", WorkspaceViewSet, basename="workspaces")
router.register(
    "automation-servers",
    AutomationServerViewSet,
    basename="automation-servers",
)


app_name = "api"
urlpatterns = router.urls + workspaces_urlpatterns
