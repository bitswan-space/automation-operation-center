import os
import requests
from django.shortcuts import redirect
from django.contrib.auth import login
from django.contrib.auth import get_user_model
from django.http import HttpRequest
from django.conf import settings
from django.contrib import messages
from django.urls import reverse
from django.contrib.auth.mixins import LoginRequiredMixin
from django.contrib.messages.views import SuccessMessageMixin
from django.utils.translation import gettext_lazy as _
from django.views.generic import DetailView
from django.views.generic import RedirectView
from django.views.generic import UpdateView
import logging

logger = logging.getLogger(__name__)

# Original user views
class UserDetailView(LoginRequiredMixin, DetailView):
    model = get_user_model()
    slug_field = "id"
    slug_url_kwarg = "id"


user_detail_view = UserDetailView.as_view()


class UserUpdateView(LoginRequiredMixin, SuccessMessageMixin, UpdateView):
    model = get_user_model()
    fields = ["name"]
    success_message = _("Information successfully updated")

    def get_success_url(self):
        # for mypy to know that the user is authenticated
        assert self.request.user.is_authenticated
        return self.request.user.get_absolute_url()

    def get_object(self):
        return self.request.user


user_update_view = UserUpdateView.as_view()


class UserRedirectView(LoginRequiredMixin, RedirectView):
    permanent = False

    def get_redirect_url(self):
        return reverse("users:detail", kwargs={"pk": self.request.user.pk})


user_redirect_view = UserRedirectView.as_view()

# Keycloak OAuth views

def keycloak_login(request: HttpRequest):
    """Initiate Keycloak OAuth login."""
    # Build the Keycloak authorization URL - use frontend URL for browser access
    keycloak_url = os.environ.get('KEYCLOAK_FRONTEND_URL')
    realm = os.environ.get('KEYCLOAK_REALM_NAME', 'master')
    client_id = os.environ.get('KEYCLOAK_CLIENT_ID', 'bitswan-backend')
    
    # Generate state parameter for security
    import secrets
    state = secrets.token_urlsafe(32)
    request.session['oauth_state'] = state
    
    # Build the authorization URL
    auth_url = f"{keycloak_url}/realms/{realm}/protocol/openid-connect/auth"
    params = {
        'client_id': client_id,
        'response_type': 'code',
        'scope': 'openid profile email',
        'redirect_uri': request.build_absolute_uri(reverse('users:keycloak_callback')),
        'state': state,
    }
    
    # Add next parameter if provided
    next_url = request.GET.get('next', '/admin/')
    request.session['oauth_next'] = next_url
    
    # Build the full URL
    from urllib.parse import urlencode
    full_url = f"{auth_url}?{urlencode(params)}"
    
    logger.info(f"Redirecting to Keycloak: {full_url}")
    return redirect(full_url)

def keycloak_callback(request: HttpRequest):
    """Handle Keycloak OAuth callback."""
    # Verify state parameter
    state = request.GET.get('state')
    if state != request.session.get('oauth_state'):
        logger.error("Invalid state parameter")
        messages.error(request, "Invalid authentication state")
        return redirect('/admin/login/')
    
    # Get authorization code
    code = request.GET.get('code')
    if not code:
        logger.error("No authorization code received")
        messages.error(request, "No authorization code received")
        return redirect('/admin/login/')
    
    # Exchange code for token
    token_data = exchange_code_for_token(request, code)
    if not token_data:
        messages.error(request, "Failed to exchange code for token")
        return redirect('/admin/login/')
    
    # Get user info from Keycloak
    user_info = get_user_info(token_data['access_token'])
    if not user_info:
        messages.error(request, "Failed to get user information")
        return redirect('/admin/login/')
    
    # Create or update Django user
    user = create_or_update_user(user_info)
    if not user:
        messages.error(request, "Failed to create user")
        return redirect('/admin/login/')
    
    # Check if user should have admin access
    if should_grant_admin_access(user_info):
        user.is_staff = True
        user.is_superuser = True
        user.save()
        logger.info(f"Granted admin access to user {user.email}")
    else:
        user.is_staff = False
        user.is_superuser = False
        user.save()
        logger.info(f"Denied admin access to user {user.email}")
    
    # Log the user in using the Keycloak authentication backend
    login(request, user, backend='bitswan_backend.core.authentication_backends.KeycloakAdminAuthenticationBackend')
    
    # Redirect to the intended destination
    next_url = request.session.get('oauth_next', '/admin/')
    logger.info(f"User {user.email} logged in successfully, redirecting to {next_url}")
    return redirect(next_url)
        

def exchange_code_for_token(request: HttpRequest, code: str) -> dict:
    """Exchange authorization code for access token."""
    keycloak_url = os.environ.get('KEYCLOAK_SERVER_URL')
    realm = os.environ.get('KEYCLOAK_REALM_NAME', 'master')
    client_id = os.environ.get('KEYCLOAK_CLIENT_ID', 'bitswan-backend')
    client_secret = os.environ.get('KEYCLOAK_CLIENT_SECRET_KEY')
    
    token_url = f"{keycloak_url}/realms/{realm}/protocol/openid-connect/token"
    
    data = {
        'grant_type': 'authorization_code',
        'client_id': client_id,
        'client_secret': client_secret,
        'code': code,
        'redirect_uri': request.build_absolute_uri(reverse('users:keycloak_callback')),
    }
    
    response = requests.post(token_url, data=data)
    if response.status_code == 200:
        return response.json()
    else:
        logger.error(f"Token exchange failed: {response.status_code} - {response.text}")
        return None

def get_user_info(access_token: str) -> dict:
    """Get user information from Keycloak."""
    keycloak_url = os.environ.get('KEYCLOAK_SERVER_URL')
    realm = os.environ.get('KEYCLOAK_REALM_NAME', 'master')
    
    userinfo_url = f"{keycloak_url}/realms/{realm}/protocol/openid-connect/userinfo"
    
    headers = {
        'Authorization': f'Bearer {access_token}'
    }
    
    response = requests.get(userinfo_url, headers=headers)
    if response.status_code == 200:
        return response.json()
    else:
        logger.error(f"User info request failed: {response.status_code} - {response.text}")
        return None

def create_or_update_user(user_info: dict) -> get_user_model():
    """Create or update Django user from Keycloak user info."""
    email = user_info.get('email')
    if not email:
        logger.error("No email in user info")
        return None
    
    # Get or create user
    user, created = get_user_model().objects.get_or_create(
        email=email,
        defaults={
            'email': email,
            'name': user_info.get('given_name', '') + ' ' + user_info.get('family_name', ''),
        }
    )
    
    if created:
        logger.info(f"Created new user: {email}")
    else:
        logger.info(f"Updated existing user: {email}")
    
    return user

def should_grant_admin_access(user_info: dict) -> bool:
    """Check if user should have admin access based on Keycloak group membership."""
    try:
        from bitswan_backend.core.services.keycloak import KeycloakService
        
        user_id = user_info.get('sub')
        if not user_id:
            return False
        
        keycloak_service = KeycloakService()
        is_global_superadmin = keycloak_service.is_global_superadmin(user_id)
        
        # Also check email verification
        email_verified = user_info.get('email_verified', False)
        
        return is_global_superadmin and email_verified
        
    except Exception as e:
        logger.error(f"Error checking admin access: {e}")
        return False
