from django.urls import path

from bitswan_backend.core.views.workspaces_merged import RegisterCLIAPIView

urlpatterns = [
    path(
        "cli/register/",
        RegisterCLIAPIView.as_view(),
        name="register_cli",
    ),
]

