from django.urls import path

from bitswan_backend.workspaces.api.views import GetProfileEmqxJWTAPIView, GetUserEmqxJwtsAPIView
from bitswan_backend.workspaces.api.views import GetProfileManagerEmqxJWTAPIView
from bitswan_backend.workspaces.api.views import RegisterCLIAPIView

urlpatterns = [
    path(
        "profiles/<str:profile_id>/emqx/jwt/",
        GetProfileEmqxJWTAPIView.as_view(),
        name="profile_emqx_jwt",
    ),
    path(
        "user/emqx/jwts/",
        GetUserEmqxJwtsAPIView.as_view(),
        name="user_emqx_jwts",
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
