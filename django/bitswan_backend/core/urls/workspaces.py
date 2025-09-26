from django.urls import path

from bitswan_backend.core.views.workspaces import GetUserEmqxJwtsAPIView

urlpatterns = [
    path(
        "user/emqx/jwts/",
        GetUserEmqxJwtsAPIView.as_view(),
        name="user_emqx_jwts",
    ),
]

