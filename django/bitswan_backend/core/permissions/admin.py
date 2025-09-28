from rest_framework.permissions import BasePermission
from bitswan_backend.core.services.keycloak import KeycloakService
import logging

logger = logging.getLogger(__name__)


class IsOrgAdmin(BasePermission):
    """
    Custom permission to only allow admin users in the current organization.
    """
    
    def has_permission(self, request, view):
        """
        Check if the user is an admin in the current organization.
        """
        try:
            keycloak_service = KeycloakService()
            is_admin = keycloak_service.is_admin(request)
            
            if not is_admin:
                logger.warning(f"Non-admin user {request.user} attempted to access admin-only endpoint")
            
            return is_admin
        except Exception as e:
            logger.error(f"Error checking admin permission: {e}")
            return False
