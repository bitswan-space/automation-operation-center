import logging

from rest_framework import viewsets

from bitswan_backend.core.authentication import KeycloakAuthentication
from bitswan_backend.core.pagination import DefaultPagination
from bitswan_backend.core.viewmixins import KeycloakMixin
from bitswan_backend.dashboard_hub.api.serializers import DashboardEntrySerializer
from bitswan_backend.dashboard_hub.models import DashboardEntry

logger = logging.getLogger(__name__)


class DashboardEntryViewSet(KeycloakMixin, viewsets.ModelViewSet):
    serializer_class = DashboardEntrySerializer
    pagination_class = DefaultPagination
    authentication_classes = [KeycloakAuthentication]

    def get_queryset(self):
        org_id = self.get_active_user_org_id()
        return DashboardEntry.objects.filter(
            keycloak_group_id=org_id,
        ).order_by("-updated_at")

    def perform_create(self, serializer):
        logger.info("Creating new Dashboard Entry.")
        logger.info(self.get_active_user_org_id())
        serializer.save(keycloak_group_id=self.get_active_user_org_id())

    def perform_update(self, serializer):
        logger.info("Updating Dashboard Entry.")
        serializer.save(keycloak_group_id=self.get_active_user_org_id())
