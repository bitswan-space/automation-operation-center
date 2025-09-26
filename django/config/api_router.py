from django.urls import path, include

from bitswan_backend.core.urls.frontend_api import urlpatterns as frontend_api_urlpatterns
from bitswan_backend.core.urls.automation_server_api import urlpatterns as automation_server_api_urlpatterns

app_name = "api"
urlpatterns = [
    # Frontend API - used by web interface with Keycloak authentication
    path("frontend/", include((frontend_api_urlpatterns, "frontend"), namespace="frontend")),
    
    # Automation Server API - used by automation servers with Bearer token authentication
    path("automation_server/", include((automation_server_api_urlpatterns, "automation_server"), namespace="automation_server")),
]
