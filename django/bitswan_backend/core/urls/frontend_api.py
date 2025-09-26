"""
URL configuration for frontend API endpoints.
These endpoints are used by the web interface (NextJS with Keycloak auth).
"""
from django.urls import path, include
from rest_framework.routers import SimpleRouter

from bitswan_backend.core.views.frontend.automation_servers import (
    AutomationServerViewSet,
    CreateAutomationServerWithOTPAPIView,
    CheckOTPStatusAPIView,
)
from bitswan_backend.core.views.frontend.workspaces import (
    WorkspaceViewSet,
    GetUserEmqxJwtsAPIView,
)
from bitswan_backend.core.views.frontend.groups import (
    OrgUsersViewSet,
    OrgViewSet,
    UserGroupViewSet,
)
from bitswan_backend.users.api.views import UserViewSet

# Router for ViewSets
router = SimpleRouter()
router.register(r'users', UserViewSet)
router.register(r'user-groups', UserGroupViewSet, basename='user-groups')
router.register(r'org-users', OrgUsersViewSet, basename='org-users')
router.register(r'orgs', OrgViewSet, basename='orgs')
router.register(r'workspaces', WorkspaceViewSet, basename='workspaces')
router.register(r'automation-servers', AutomationServerViewSet, basename='automation-servers')

urlpatterns = [
    # Automation server OTP management
    path('automation-servers/create-with-otp/', CreateAutomationServerWithOTPAPIView.as_view(), name='create_automation_server_with_otp'),
    path('automation-servers/check-otp-status/', CheckOTPStatusAPIView.as_view(), name='check_otp_status'),
    
    # User EMQX tokens
    path('user/emqx/jwts/', GetUserEmqxJwtsAPIView.as_view(), name='user_emqx_jwts'),
    
    # Include ViewSet routes
    path('', include(router.urls)),
]