from django.urls import path

from bitswan_backend.workspaces.api.views import GetUserEmqxJwtsAPIView
from bitswan_backend.workspaces.api.views import RegisterCLIAPIView

urlpatterns = [
    path(
        "user/emqx/jwts/",
        GetUserEmqxJwtsAPIView.as_view(),
        name="user_emqx_jwts",
    ),
    path(
        "cli/register/",
        RegisterCLIAPIView.as_view(),
        name="register_cli",
    ),
]
