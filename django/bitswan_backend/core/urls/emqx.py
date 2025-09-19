from django.urls import path

from bitswan_backend.workspaces.api.views import RegisterCLIAPIView

urlpatterns = [
    path(
        "cli/register/",
        RegisterCLIAPIView.as_view(),
        name="register_cli",
    ),
]
