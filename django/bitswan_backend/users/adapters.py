from __future__ import annotations

import typing

import logging

from allauth.account.adapter import DefaultAccountAdapter
from allauth.socialaccount.adapter import DefaultSocialAccountAdapter
from django.conf import settings
from django.contrib import messages

if typing.TYPE_CHECKING:
    from allauth.socialaccount.models import SocialLogin
    from django.http import HttpRequest

    from bitswan_backend.users.models import User

logger = logging.getLogger(__name__)

# Test logging
logger.info("SocialAccountAdapter module loaded - logging is working!")

class AccountAdapter(DefaultAccountAdapter):
    def is_open_for_signup(self, request: HttpRequest) -> bool:
        return getattr(settings, "ACCOUNT_ALLOW_REGISTRATION", True)


class SocialAccountAdapter(DefaultSocialAccountAdapter):
    def is_open_for_signup(
        self,
        request: HttpRequest,
        sociallogin: SocialLogin,
    ) -> bool:
        return getattr(settings, "ACCOUNT_ALLOW_REGISTRATION", True)

    def pre_social_login(self, request: HttpRequest, sociallogin: SocialLogin) -> None:
        """
        Handle Keycloak login and check for GlobalSuperAdmin group membership.
        """
        logger.info(f"pre_social_login called for provider: {sociallogin.account.provider}")
        if sociallogin.account.provider == 'keycloak':
            logger.info("Handling Keycloak login")
            self._handle_keycloak_login(request, sociallogin)
        else:
            logger.info(f"Not a Keycloak login, provider: {sociallogin.account.provider}")

    def _handle_keycloak_login(self, request: HttpRequest, sociallogin: SocialLogin) -> None:
        """Handle Keycloak login and set Django admin permissions."""
        try:
            from bitswan_backend.core.services.keycloak import KeycloakService
            
            user_info = sociallogin.account.extra_data
            logger.info(f"Keycloak user info: {user_info}")
            
            user_id = user_info.get('sub')
            email = user_info.get('email')
            
            logger.info(f"User ID: {user_id}, Email: {email}")
            
            if not user_id or not email:
                logger.warning(f"Missing user_id or email in Keycloak user info: {user_info}")
                return
            
            # Check if user is in GlobalSuperAdmin group
            keycloak_service = KeycloakService()
            is_global_superadmin = keycloak_service.is_global_superadmin(user_id)
            
            # Check if email is verified
            email_verified = user_info.get('email_verified', False)
            
            # Get or create Django user
            user = sociallogin.user
            
            if is_global_superadmin and email_verified:
                user.is_staff = True
                user.is_superuser = True
                user.save()
                logger.info(f"User {email} granted Django admin access via GlobalSuperAdmin group")
            else:
                if user.is_staff or user.is_superuser:
                    user.is_staff = False
                    user.is_superuser = False
                    user.save()
                    reason = "not in GlobalSuperAdmin group" if not is_global_superadmin else "email not verified"
                    logger.info(f"User {email} Django admin access revoked - {reason}")
                    
        except Exception as e:
            logger.error(f"Error handling Keycloak login: {e}")

    def populate_user(
        self,
        request: HttpRequest,
        sociallogin: SocialLogin,
        data: dict[str, typing.Any],
    ) -> User:
        """
        Populates user information from social provider info.

        See: https://docs.allauth.org/en/latest/socialaccount/advanced.html#creating-and-populating-user-instances
        """
        user = super().populate_user(request, sociallogin, data)
        if not user.name:
            if name := data.get("name"):
                user.name = name
            elif first_name := data.get("first_name"):
                user.name = first_name
                if last_name := data.get("last_name"):
                    user.name += f" {last_name}"
        return user
