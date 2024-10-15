from django.conf import settings
from rest_framework.routers import DefaultRouter
from rest_framework.routers import SimpleRouter

from bitswan_backend.brokers.api.views import OrgUsersViewSet
from bitswan_backend.brokers.api.views import UserGroupViewSet
from bitswan_backend.dashboard_hub.api.views import DashboardEntryViewSet
from bitswan_backend.deployments.urls import urlpatterns as deployments_urlpatterns
from bitswan_backend.gitops.api.views import GitopsViewSet
from bitswan_backend.users.api.views import UserViewSet

router = DefaultRouter() if settings.DEBUG else SimpleRouter()

router.register("users", UserViewSet)

router.register("gitops", GitopsViewSet, basename="gitops")
router.register("user-groups", UserGroupViewSet, basename="user-groups")
router.register("org-users", OrgUsersViewSet, basename="org-users")
router.register(
    "dashboard-entries",
    DashboardEntryViewSet,
    basename="dashboard-entries",
)


app_name = "api"
urlpatterns = router.urls + deployments_urlpatterns
urlpatterns = router.urls + deployments_urlpatterns
