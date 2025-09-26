import logging
from typing import Optional

from django.contrib.auth import get_user_model
from django.contrib.auth.backends import ModelBackend
from django.contrib.auth.models import AnonymousUser

from bitswan_backend.core.services.keycloak import KeycloakService

User = get_user_model()
logger = logging.getLogger(__name__)


class KeycloakAdminAuthenticationBackend(ModelBackend):
    """
    Custom authentication backend that supports both Keycloak and password authentication
    for Django admin access. Users in the GlobalSuperAdmin Keycloak group get Django
    admin access automatically.
    """
    
    def authenticate(self, request, username=None, password=None, **kwargs):
        """
        Authenticate using either Keycloak token or Django password.
        
        Args:
            request: Django request object
            username: Username/email for password authentication
            password: Password for password authentication
            
        Returns:
            User object if authenticated, None otherwise
        """
        # Try Keycloak authentication first (for API/admin with token)
        if request and hasattr(request, 'headers'):
            keycloak_user = self._authenticate_keycloak(request)
            if keycloak_user:
                return keycloak_user
        
        # Fall back to password authentication
        if username and password:
            return self._authenticate_password(username, password)
            
        return None
    
    def _authenticate_keycloak(self, request) -> Optional[User]:
        """Authenticate using Keycloak token."""
        try:
            keycloak_service = KeycloakService()
            user_info = keycloak_service.get_claims(request)
            
            if not user_info:
                return None
                
            email = user_info.get("email")
            if not email:
                return None
            
            # Get or create Django user
            user, created = User.objects.get_or_create(
                email=email,
                defaults={
                    'name': user_info.get('name', ''),
                    'is_active': True,
                }
            )
            
            # Check if user is in GlobalSuperAdmin group
            is_global_superadmin = self._is_global_superadmin(user_info.get('sub'))
            
            # Check email verification status (default to True if not present in token)
            email_verified = user_info.get('email_verified')
            if email_verified is None:
                # If email_verified not in token, check via Keycloak API
                email_verified = self._is_email_verified_by_email(email)
            
            if is_global_superadmin and email_verified:
                user.is_staff = True
                user.is_superuser = True
                user.save()
                logger.info(f"User {email} granted Django admin access via GlobalSuperAdmin group")
            else:
                # Ensure user is not admin if not in GlobalSuperAdmin group or email not verified
                if user.is_staff or user.is_superuser:
                    user.is_staff = False
                    user.is_superuser = False
                    user.save()
                    reason = "not in GlobalSuperAdmin group" if not is_global_superadmin else "email not verified"
                    logger.info(f"User {email} Django admin access revoked - {reason}")
            
            return user
            
        except Exception as e:
            logger.exception(f"Keycloak authentication failed: {e}")
            return None
    
    def _authenticate_password(self, username: str, password: str) -> Optional[User]:
        """Authenticate using Django password."""
        try:
            # Try to find user by email
            user = User.objects.get(email=username)
            
            # Check password
            if user.check_password(password):
                # Check if user is in GlobalSuperAdmin group and has verified email
                if self._is_global_superadmin_by_email(username) and self._is_email_verified_by_email(username):
                    user.is_staff = True
                    user.is_superuser = True
                    user.save()
                    logger.info(f"User {username} granted Django admin access via GlobalSuperAdmin group")
                else:
                    # Ensure user is not admin if not in GlobalSuperAdmin group or email not verified
                    if user.is_staff or user.is_superuser:
                        user.is_staff = False
                        user.is_superuser = False
                        user.save()
                        reason = "not in GlobalSuperAdmin group" if not self._is_global_superadmin_by_email(username) else "email not verified"
                        logger.info(f"User {username} Django admin access revoked - {reason}")
                
                return user
                
        except User.DoesNotExist:
            pass
        except Exception as e:
            logger.exception(f"Password authentication failed: {e}")
            
        return None
    
    def _is_global_superadmin(self, keycloak_user_id: str) -> bool:
        """Check if Keycloak user is in GlobalSuperAdmin group."""
        try:
            keycloak_service = KeycloakService()
            return keycloak_service.is_global_superadmin(keycloak_user_id)
                    
        except Exception as e:
            logger.exception(f"Failed to check GlobalSuperAdmin membership: {e}")
            
        return False
    
    def _is_global_superadmin_by_email(self, email: str) -> bool:
        """Check if user with email is in GlobalSuperAdmin group."""
        try:
            keycloak_service = KeycloakService()
            user_id = keycloak_service.find_user_by_email(email)
            
            if user_id:
                return self._is_global_superadmin(user_id)
                
        except Exception as e:
            logger.exception(f"Failed to check GlobalSuperAdmin membership by email: {e}")
            
        return False
    
    def _is_email_verified_by_email(self, email: str) -> bool:
        """Check if user with email has verified email in Keycloak."""
        try:
            keycloak_service = KeycloakService()
            user_id = keycloak_service.find_user_by_email(email)
            
            if user_id:
                return keycloak_service.is_email_verified(user_id)
                
        except Exception as e:
            logger.exception(f"Failed to check email verification by email: {e}")
            
        return False
    
    def get_user(self, user_id):
        """Get user by ID."""
        try:
            return User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return None
