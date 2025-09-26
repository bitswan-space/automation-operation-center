"""
URL configuration for automation server API endpoints.
These endpoints are used by automation servers themselves (CLI).
"""
from django.urls import path, include
from rest_framework.routers import SimpleRouter

from bitswan_backend.core.views.automation_server.workspaces import WorkspaceAPIViewSet
from bitswan_backend.core.views.automation_server.server_info import AutomationServerInfoAPIView
from bitswan_backend.core.views.automation_server.authentication import ExchangeOTPForTokenAPIView

# Router for ViewSets
router = SimpleRouter()
router.register(r'workspaces', WorkspaceAPIViewSet, basename='automation-server-workspaces')

urlpatterns = [
    # OTP exchange (no authentication required)
    path('exchange-otp/', ExchangeOTPForTokenAPIView.as_view(), name='exchange_otp_for_token'),
    
    # Automation server info (requires authentication)
    path('info/', AutomationServerInfoAPIView.as_view(), name='automation_server_info'),
    
    # Include ViewSet routes
    path('', include(router.urls)),
]