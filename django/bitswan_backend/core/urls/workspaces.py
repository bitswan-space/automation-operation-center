from django.urls import path

from bitswan_backend.core.views.workspaces import RegisterCLIAPIView
from bitswan_backend.core.views.workspaces import GetUserEmqxJwtsAPIView

urlpatterns = [
    path(
        "cli/register/",
        RegisterCLIAPIView.as_view(),
        name="register_cli",
    ),
    path(
        "user/emqx/jwts/",
        GetUserEmqxJwtsAPIView.as_view(),
        name="user_emqx_jwts",
    ),
]

