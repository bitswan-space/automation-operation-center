from django.urls import path

from bitswan_backend.core.views.automation_server import (
    CreateAutomationServerWithOTPAPIView,
    ExchangeOTPForTokenAPIView,
    CheckOTPStatusAPIView,
)

urlpatterns = [
    path(
        "automation-servers/create-with-otp/",
        CreateAutomationServerWithOTPAPIView.as_view(),
        name="create_automation_server_with_otp",
    ),
    path(
        "automation-servers/exchange-otp/",
        ExchangeOTPForTokenAPIView.as_view(),
        name="exchange_otp_for_token",
    ),
    path(
        "automation-servers/check-otp-status/",
        CheckOTPStatusAPIView.as_view(),
        name="check_otp_status",
    ),
]
