from django.conf import settings
from rest_framework.routers import DefaultRouter
from rest_framework.routers import SimpleRouter

from bitswan_backend.brokers.api.views import BrokerViewSet
from bitswan_backend.deployments.urls import urlpatterns as deployments_urlpatterns
from bitswan_backend.gitops.api.views import GitopsViewSet
from bitswan_backend.users.api.views import UserViewSet

router = DefaultRouter() if settings.DEBUG else SimpleRouter()

router.register("users", UserViewSet)

router.register("gitops", GitopsViewSet, basename="gitops")
router.register("brokers", BrokerViewSet, basename="brokers")


app_name = "api"
urlpatterns = router.urls + deployments_urlpatterns
