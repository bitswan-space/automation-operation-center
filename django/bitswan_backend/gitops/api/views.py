import logging

from rest_framework import viewsets

from bitswan_backend.core.authentication import KeycloakAuthentication
from bitswan_backend.core.pagination import DefaultPagination
from bitswan_backend.core.viewmixins import KeycloakMixin
from bitswan_backend.gitops.api.serializers import GitopsSerializer
from bitswan_backend.gitops.models import Gitops

logger = logging.getLogger(__name__)


class GitopsViewSet(KeycloakMixin, viewsets.ModelViewSet):
    serializer_class = GitopsSerializer
    pagination_class = DefaultPagination
    authentication_classes = [KeycloakAuthentication]

    def get_queryset(self):
        org_id = self.get_active_user_org_id()
        return Gitops.objects.filter(keycloak_group_id=org_id).order_by("-updated_at")

    def perform_create(self, serializer):
        serializer.save(keycloak_group_id=self.get_active_user_org_id())

    def perform_update(self, serializer):
        serializer.save(keycloak_group_id=self.get_active_user_org_id())
