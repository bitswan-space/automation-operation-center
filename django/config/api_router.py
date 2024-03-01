from django.conf import settings
from rest_framework.routers import DefaultRouter
from rest_framework.routers import SimpleRouter

from apps.gitops.api.views import BrokerViewSet
from apps.gitops.api.views import GitopsViewSet
from apps.gitops.urls import urlpatterns as gitopsurls
from bitswan_backend.users.api.views import UserViewSet

router = DefaultRouter() if settings.DEBUG else SimpleRouter()

router.register("users", UserViewSet)

router.register("gitops", GitopsViewSet, basename="gitops")
router.register("brokers", BrokerViewSet, basename="brokers")


app_name = "api"
urlpatterns = router.urls + gitopsurls
