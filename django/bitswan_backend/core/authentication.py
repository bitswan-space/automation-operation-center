import logging

from django.contrib.auth import get_user_model
from rest_framework.authentication import BaseAuthentication

from bitswan_backend.core.exceptions import TokenExpiredOrInvalid
from bitswan_backend.core.services.keycloak import KeycloakService

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

        return (user, None)
