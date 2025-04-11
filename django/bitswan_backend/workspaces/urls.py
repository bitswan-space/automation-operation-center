from django.urls import path

from bitswan_backend.workspaces.api.views import GetAutomationServerEmqxJWTAPIView
from bitswan_backend.workspaces.api.views import GetProfileEmqxJWTAPIView
from bitswan_backend.workspaces.api.views import GetProfileManagerEmqxJWTAPIView
from bitswan_backend.workspaces.api.views import RegisterCLIAPIView

urlpatterns = [
    path(
        "profiles/<str:profile_id>/emqx/jwt/",
        GetProfileEmqxJWTAPIView.as_view(),
        name="profile_emqx_jwt",
    ),
    path(
        "automation-servers/<str:automation_server_id>/emqx/jwt/",
        GetAutomationServerEmqxJWTAPIView.as_view(),
        name="automation_server_emqx_jwt",
    ),
    path(
        "root/emqx/jwt/",
        GetProfileManagerEmqxJWTAPIView.as_view(),
        name="profile_manager_emqx_jwt",
    ),
    path(
        "cli/register/",
        RegisterCLIAPIView.as_view(),
        name="register_cli",
    ),
]
