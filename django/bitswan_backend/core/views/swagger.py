from django.http import HttpResponse
from django.views import View
from drf_spectacular.views import SpectacularSwaggerView, SpectacularAPIView


class PublicSwaggerView(SpectacularSwaggerView):
    """
    Custom Swagger view that bypasses authentication entirely.
    This prevents JWT token validation errors when accessing the API documentation.
    """
    authentication_classes = []  # No authentication required
    permission_classes = []      # No permissions required


class PublicSchemaView(SpectacularAPIView):
    """
    Custom API schema view that bypasses authentication entirely.
    This prevents JWT token validation errors when accessing the API schema.
    """
    authentication_classes = []  # No authentication required
    permission_classes = []      # No permissions required
