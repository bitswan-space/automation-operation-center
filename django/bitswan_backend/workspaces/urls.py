from django.urls import path

from bitswan_backend.workspaces.api.views import GetProfileEmqxJWT

urlpatterns = [
    path(
        "profiles/<str:profile_id>/emqx/jwt/",
        GetProfileEmqxJWT.as_view(),
        name="profile_emqx_jwt",
    ),
]
