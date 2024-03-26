from rest_framework import viewsets

from bitswan_backend.brokers.api.serializers import BrokerSerializer
from bitswan_backend.brokers.models import Brokers
from bitswan_backend.core.pagination import DefaultPagination


class BrokerViewSet(viewsets.ModelViewSet):
    queryset = Brokers.objects.all()
    serializer_class = BrokerSerializer
    pagination_class = DefaultPagination
