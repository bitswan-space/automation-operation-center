"""Custom error handlers for Django."""
import logging

from django.http import JsonResponse
from django.views import defaults as default_views

logger = logging.getLogger(__name__)


def page_not_found(request, exception):
    """
    Custom 404 handler that returns JSON for API requests and logs a simple message.
    
    This avoids the issue where Django's debug context processor tries to access
    .name on URLResolver objects, causing multiple exceptions.
    """
    # Log a simple 404 message
    logger.warning("404 Not Found: %s %s", request.method, request.path)
    
    # For API requests or requests that accept JSON, return JSON
    if request.path.startswith("/api/") or "application/json" in request.META.get("HTTP_ACCEPT", ""):
        return JsonResponse(
            {"detail": "Not found."},
            status=404,
        )
    
    # For non-API requests, use Django's default handler
    return default_views.page_not_found(request, exception)

