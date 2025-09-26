"""
Automation Server API server information views
"""
import logging

from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from drf_spectacular.utils import extend_schema

from bitswan_backend.core.authentication import AutomationServerAuthentication
from bitswan_backend.core.serializers.automation_server import AutomationServerSerializer

L = logging.getLogger("core.views.automation_server.server_info")


class AutomationServerMixin:
    """
    Mixin for automation server API views that provides common functionality
    """
    
    def get_automation_server(self):
        """Get the automation server from the authenticated request"""
        return getattr(self.request, 'automation_server', None)


@extend_schema(tags=["Automation Server API - Server Info"])
class AutomationServerInfoAPIView(AutomationServerMixin, APIView):
    """
    Get information about the current automation server
    """
    authentication_classes = [AutomationServerAuthentication]
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        automation_server = self.get_automation_server()
        serializer = AutomationServerSerializer(automation_server)
        return Response(serializer.data)
