from rest_framework.viewsets import ModelViewSet

from apps.gitops.api.pagination import DefaultPagination
from apps.gitops.api.serializers import BrokerSerializer
from apps.gitops.api.serializers import GitopsSerializer
from apps.gitops.models import Brokers
from apps.gitops.models import Gitops


class GitopsViewSet(ModelViewSet):
    pagination_class = DefaultPagination
    ordering_fields = ["-updated_at", "payment_status"]

    def get_serializer_class(self):
        return GitopsSerializer

    def get_queryset(self):
        return Gitops.objects.all()


class BrokerViewSet(ModelViewSet):
    pagination_class = DefaultPagination
    ordering_fields = ["-updated_at", "payment_status"]

    def get_serializer_class(self):
        return BrokerSerializer

    def get_queryset(self):
        return Brokers.objects.all()
