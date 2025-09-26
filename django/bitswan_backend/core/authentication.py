import logging

from django.contrib.auth import get_user_model
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed

from bitswan_backend.core.exceptions import TokenExpiredOrInvalid
from bitswan_backend.core.services.keycloak import KeycloakService
from bitswan_backend.core.models import AutomationServer

User = get_user_model()

logger = logging.getLogger(__name__)


class KeycloakAuthentication(BaseAuthentication):
    def authenticate(self, request):
        keycloak = KeycloakService()

        user_info = keycloak.get_claims(request)
        if not user_info:
            raise TokenExpiredOrInvalid

        email = user_info.get("email")
        if not email:
            raise TokenExpiredOrInvalid

        user = User.objects.get_or_create(email=email)[0]
        logger.info("User: %s", user)

        return (user, None)


class AutomationServerAuthentication(BaseAuthentication):
    """
    Authentication for automation servers using their access tokens.
    
    Expected header format:
    Authorization: Bearer <access_token>
    """
    
    def authenticate(self, request):
        auth_header = request.META.get('HTTP_AUTHORIZATION')
        if not auth_header:
            return None
            
        try:
            token_type, token = auth_header.split(' ', 1)
        except ValueError:
            raise AuthenticationFailed('Invalid authorization header format')
            
        if token_type.lower() != 'bearer':
            raise AuthenticationFailed('Invalid token type. Expected Bearer token')
            
        # Find automation server with this token
        try:
            automation_server = AutomationServer.objects.get(access_token=token)
        except AutomationServer.DoesNotExist:
            raise AuthenticationFailed('Invalid or expired access token')
            
        # Check if token is still valid
        if not automation_server.is_token_valid(token):
            raise AuthenticationFailed('Invalid or expired access token')
            
        # Create a fake user object for DRF compatibility
        # We'll store the automation server in the request for later use
        fake_user = User(
            email=f"automation_server_{automation_server.automation_server_id}@internal.bitswan.io",
            is_active=True
        )
        # Attach automation server to the request
        request.automation_server = automation_server
        
        return (fake_user, automation_server)
