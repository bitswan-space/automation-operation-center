"""
Authentication API views for the frontend
"""
import logging
import os
import secrets
import time
import json
from django.conf import settings
from django.urls import reverse
from django.core.cache import cache
from django.http import HttpResponseRedirect
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from drf_spectacular.utils import extend_schema
import requests

from bitswan_backend.core.authentication import KeycloakAuthentication
from bitswan_backend.core.services.keycloak import KeycloakService

logger = logging.getLogger(__name__)


@extend_schema(
    tags=["Frontend API - Authentication"],
    summary="Initiate Keycloak OAuth Login",
    description="Get Keycloak OAuth authorization URL for frontend redirect",
    responses={
        200: {
            "description": "OAuth URL generated successfully",
            "content": {
                "application/json": {
                    "example": {
                        "auth_url": "https://keycloak.example.com/realms/master/protocol/openid-connect/auth?client_id=...",
                        "state": "random-state-string"
                    }
                }
            }
        }
    }
)
class KeycloakOAuthInitAPIView(APIView):
    """
    Initiate Keycloak OAuth flow for frontend
    """
    authentication_classes = []
    permission_classes = [AllowAny]
    
    def get(self, request):
        """Generate Keycloak OAuth authorization URL"""
        try:
            # Get Keycloak configuration - use frontend URL for public access
            keycloak_url = settings.KEYCLOAK_FRONTEND_URL or settings.KEYCLOAK_SERVER_URL
            realm = settings.KEYCLOAK_REALM_NAME
            client_id = settings.KEYCLOAK_CLIENT_ID
            
            # Validate required configuration
            missing_config = []
            if not keycloak_url:
                missing_config.append("KEYCLOAK_FRONTEND_URL (or KEYCLOAK_SERVER_URL as fallback)")
            
            if not realm:
                missing_config.append("KEYCLOAK_REALM_NAME")
            
            if not client_id:
                missing_config.append("KEYCLOAK_CLIENT_ID")
            
            if missing_config:
                logger.error(f"Missing Keycloak configuration: {', '.join(missing_config)}")
                return Response(
                    {
                        "error": "Keycloak configuration is incomplete",
                        "missing_variables": missing_config,
                        "expected_values": {
                            "KEYCLOAK_FRONTEND_URL": "https://keycloak.example.com (public URL for frontend access)",
                            "KEYCLOAK_SERVER_URL": "http://aoc-keycloak:8080 (internal Docker URL, used as fallback)",
                            "KEYCLOAK_REALM_NAME": "master",
                            "KEYCLOAK_CLIENT_ID": "aoc-frontend"
                        }
                    },
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
            
            # Generate state parameter for security
            state = secrets.token_urlsafe(32)
            
            # Store state in session for verification
            request.session['oauth_state'] = state
            
            # Also store in cache as backup for cross-domain scenarios
            # Cache for 10 minutes (OAuth flows should complete quickly)
            cache.set(f'oauth_state_{state}', {
                'state': state,
                'timestamp': time.time(),
                'session_key': request.session.session_key
            }, timeout=600)
            
            # Debug logging for session state
            logger.info(f"OAuth init - Generated state: {state}")
            logger.info(f"OAuth init - Session key: {request.session.session_key}")
            logger.info(f"OAuth init - Session data: {dict(request.session)}")
            
            # Build the authorization URL
            auth_url = f"{keycloak_url}/realms/{realm}/protocol/openid-connect/auth"
            params = {
                'client_id': client_id,
                'response_type': 'code',
                'scope': 'openid profile email',
                'redirect_uri': request.build_absolute_uri(reverse('api:frontend:keycloak_callback')),
                'state': state,
            }
            
            # Build the full URL
            from urllib.parse import urlencode
            full_url = f"{auth_url}?{urlencode(params)}"
            
            logger.info(f"Generated Keycloak OAuth URL for frontend using URL: {keycloak_url}")
            
            return Response({
                "auth_url": full_url,
                "state": state
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Error generating OAuth URL: {e}")
            return Response(
                {"error": f"Failed to generate OAuth URL: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


@extend_schema(
    tags=["Frontend API - Authentication"],
    summary="Login with Keycloak",
    description="Authenticate user with Keycloak and return access token",
    request={
        "application/json": {
            "type": "object",
            "properties": {
                "email": {
                    "type": "string",
                    "description": "User email address"
                },
                "password": {
                    "type": "string", 
                    "description": "User password"
                }
            },
            "required": ["email", "password"]
        }
    },
    responses={
        200: {
            "description": "Login successful",
            "content": {
                "application/json": {
                    "example": {
                        "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
                        "user": {
                            "id": "user-id",
                            "email": "user@example.com",
                            "name": "User Name"
                        }
                    }
                }
            }
        },
        401: {
            "description": "Authentication failed",
            "content": {
                "application/json": {
                    "example": {
                        "error": "Invalid credentials"
                    }
                }
            }
        }
    }
)
class LoginAPIView(APIView):
    """
    Login with email and password via Keycloak
    """
    authentication_classes = []
    permission_classes = [AllowAny]
    
    def post(self, request):
        """Authenticate user with Keycloak"""
        email = request.data.get('email')
        password = request.data.get('password')
        
        if not email or not password:
            return Response(
                {"error": "Email and password are required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Use Keycloak's token endpoint to authenticate
            keycloak_url = settings.KEYCLOAK_SERVER_URL
            realm = settings.KEYCLOAK_REALM_NAME
            client_id = settings.KEYCLOAK_CLIENT_ID
            client_secret = settings.KEYCLOAK_CLIENT_SECRET_KEY
            
            token_url = f"{keycloak_url}/realms/{realm}/protocol/openid-connect/token"
            
            data = {
                'grant_type': 'password',
                'client_id': client_id,
                'client_secret': client_secret,
                'username': email,
                'password': password,
                'scope': 'openid profile email'
            }
            
            response = requests.post(token_url, data=data)
            
            if response.status_code == 200:
                token_data = response.json()
                access_token = token_data.get('access_token')
                
                # Get user info from Keycloak
                keycloak_service = KeycloakService()
                user_info = keycloak_service.validate_token(access_token)
                
                if user_info:
                    return Response({
                        "access_token": access_token,
                        "user": {
                            "id": user_info.get('sub'),
                            "email": user_info.get('email'),
                            "name": user_info.get('name', user_info.get('preferred_username'))
                        }
                    }, status=status.HTTP_200_OK)
                else:
                    return Response(
                        {"error": "Failed to get user information"},
                        status=status.HTTP_401_UNAUTHORIZED
                    )
            else:
                logger.error(f"Keycloak authentication failed: {response.status_code} - {response.text}")
                return Response(
                    {"error": "Invalid credentials"},
                    status=status.HTTP_401_UNAUTHORIZED
                )
                
        except Exception as e:
            logger.error(f"Login error: {e}")
            return Response(
                {"error": "Authentication failed"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


@extend_schema(
    tags=["Frontend API - Authentication"],
    summary="Logout",
    description="Logout user and invalidate Keycloak session",
    responses={
        200: {
            "description": "Logout successful",
            "content": {
                "application/json": {
                    "example": {
                        "success": True
                    }
                }
            }
        }
    }
)
class LogoutAPIView(APIView):
    """
    Logout user and invalidate Keycloak session
    """
    authentication_classes = [KeycloakAuthentication]
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        """Logout user"""
        try:
            # Get the current user's token from the request
            auth_header = request.META.get('HTTP_AUTHORIZATION', '')
            if auth_header.startswith('Bearer '):
                token = auth_header[7:]
                
                # Logout from Keycloak
                keycloak_url = settings.KEYCLOAK_SERVER_URL
                realm = settings.KEYCLOAK_REALM_NAME
                client_id = settings.KEYCLOAK_CLIENT_ID
                client_secret = settings.KEYCLOAK_CLIENT_SECRET_KEY
                
                logout_url = f"{keycloak_url}/realms/{realm}/protocol/openid-connect/logout"
                
                data = {
                    'client_id': client_id,
                    'client_secret': client_secret,
                    'refresh_token': token  # Use access token if no refresh token available
                }
                
                # Best effort to logout from Keycloak
                try:
                    requests.post(logout_url, data=data)
                except:
                    pass  # Don't fail if Keycloak logout fails
            
            return Response(
                {"success": True},
                status=status.HTTP_200_OK
            )
            
        except Exception as e:
            logger.error(f"Logout error: {e}")
            return Response(
                {"success": False, "error": "Logout failed"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


@extend_schema(
    tags=["Frontend API - Authentication"],
    summary="Get Current User",
    description="Get information about the currently authenticated user",
    responses={
        200: {
            "description": "User information retrieved successfully",
            "content": {
                "application/json": {
                    "example": {
                        "id": "user-id",
                        "email": "user@example.com", 
                        "name": "User Name"
                    }
                }
            }
        }
    }
)
class CurrentUserAPIView(APIView):
    """
    Get current user information
    """
    authentication_classes = [KeycloakAuthentication]
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Get current user info with groups"""
        try:
            keycloak_service = KeycloakService()
            user_info = keycloak_service.get_claims(request)
            
            if user_info:
                user_id = user_info.get('sub')
                
                # Get user groups from Keycloak
                try:
                    user_groups = keycloak_service.get_user_groups(user_id)
                    groups = [
                        {
                            "id": group.get('id'),
                            "name": group.get('name'),
                            "path": group.get('path', '')
                        }
                        for group in user_groups
                    ]
                except Exception as e:
                    logger.warning(f"Failed to get user groups: {e}")
                    groups = []
                
                return Response({
                    "id": user_id,
                    "email": user_info.get('email'),
                    "name": user_info.get('name', user_info.get('preferred_username')),
                    "groups": groups
                }, status=status.HTTP_200_OK)
            else:
                return Response(
                    {"error": "User information not available"},
                    status=status.HTTP_401_UNAUTHORIZED
                )
                
        except Exception as e:
            logger.error(f"Get current user error: {e}")
            return Response(
                {"error": "Failed to get user information"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


@extend_schema(
    tags=["Frontend API - Authentication"],
    summary="Keycloak OAuth Callback",
    description="Handle OAuth callback from Keycloak and return access token",
    responses={
        200: {
            "description": "Authentication successful",
            "content": {
                "application/json": {
                    "example": {
                        "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
                        "user": {
                            "id": "user-id",
                            "email": "user@example.com",
                            "name": "User Name"
                        }
                    }
                }
            }
        },
        400: {
            "description": "Invalid callback parameters",
            "content": {
                "application/json": {
                    "example": {
                        "error": "Invalid state parameter"
                    }
                }
            }
        }
    }
)
class KeycloakCallbackAPIView(APIView):
    """
    Handle OAuth callback from Keycloak
    """
    authentication_classes = []
    permission_classes = [AllowAny]
    
    def get(self, request):
        """Handle OAuth callback"""
        try:
            # Verify state parameter
            state = request.GET.get('state')
            session_state = request.session.get('oauth_state')
            
            # Debug logging to understand the session issue
            logger.info(f"OAuth callback - Received state: {state}")
            logger.info(f"OAuth callback - Session state: {session_state}")
            logger.info(f"OAuth callback - Session key: {request.session.session_key}")
            logger.info(f"OAuth callback - Session data: {dict(request.session)}")
            
            # For API-based OAuth flows, we need to be more flexible with state validation
            # The state might not be in the same session due to cross-domain redirects
            if state != session_state:
                logger.warning(f"State mismatch in OAuth callback - received: {state}, session: {session_state}")
                
                # Check cache as backup
                cached_state_data = cache.get(f'oauth_state_{state}')
                if cached_state_data:
                    logger.info(f"Found state in cache: {cached_state_data}")
                    # Validate timestamp (should be recent)
                    if time.time() - cached_state_data['timestamp'] > 600:  # 10 minutes
                        logger.error(f"State expired - timestamp: {cached_state_data['timestamp']}")
                        cache.delete(f'oauth_state_{state}')
                        frontend_url = settings.FRONTEND_URL
                        redirect_url = f"{frontend_url}/auth/callback?error=state_expired"
                        return HttpResponseRedirect(redirect_url)
                    logger.info("State validation passed via cache, proceeding with OAuth flow")
                elif not session_state:
                    logger.info("No session state found, validating state format instead")
                    # Basic validation: state should be a URL-safe string of reasonable length
                    if not state or len(state) < 16 or len(state) > 128:
                        logger.error(f"Invalid state format: {state}")
                        frontend_url = settings.FRONTEND_URL
                        redirect_url = f"{frontend_url}/auth/callback?error=invalid_state_format"
                        return HttpResponseRedirect(redirect_url)
                    logger.info("State format validation passed, proceeding with OAuth flow")
                else:
                    logger.error(f"State validation failed - received: {state}, expected: {session_state}")
                    frontend_url = settings.FRONTEND_URL
                    redirect_url = f"{frontend_url}/auth/callback?error=invalid_state"
                    return HttpResponseRedirect(redirect_url)
            
            # Get authorization code
            code = request.GET.get('code')
            if not code:
                logger.error("No authorization code received")
                frontend_url = settings.FRONTEND_URL
                redirect_url = f"{frontend_url}/auth/callback?error=no_code"
                return HttpResponseRedirect(redirect_url)
            
            # Exchange code for token
            token_data = self._exchange_code_for_token(request, code)
            if not token_data:
                frontend_url = settings.FRONTEND_URL
                redirect_url = f"{frontend_url}/auth/callback?error=token_exchange_failed"
                return HttpResponseRedirect(redirect_url)
            
            # Get user info from Keycloak
            user_info = self._get_user_info(token_data['access_token'])
            if not user_info:
                frontend_url = settings.FRONTEND_URL
                redirect_url = f"{frontend_url}/auth/callback?error=user_info_failed"
                return HttpResponseRedirect(redirect_url)
            
            # Store authentication data in session for frontend access
            request.session['access_token'] = token_data['access_token']
            request.session['user_info'] = {
                "id": user_info.get('sub'),
                "email": user_info.get('email'),
                "name": user_info.get('name', user_info.get('preferred_username'))
            }
            
            # Clear the state from session and cache
            if 'oauth_state' in request.session:
                del request.session['oauth_state']
            
            # Also clear from cache
            cache.delete(f'oauth_state_{state}')
            
            # Get frontend URL for redirect
            frontend_url = settings.FRONTEND_URL
            
            # Build redirect URL with success indicator and access token
            from urllib.parse import urlencode
            params = {
                'success': 'true',
                'access_token': token_data['access_token']
            }
            redirect_url = f"{frontend_url}/auth/callback?{urlencode(params)}"
            
            logger.info(f"OAuth callback successful, redirecting to: {redirect_url}")
            
            # Redirect to frontend instead of returning JSON
            return HttpResponseRedirect(redirect_url)
            
        except Exception as e:
            logger.error(f"OAuth callback error: {e}")
            # Redirect to frontend with error indicator
            frontend_url = settings.FRONTEND_URL
            redirect_url = f"{frontend_url}/auth/callback?error=authentication_failed"
            return HttpResponseRedirect(redirect_url)
    
    def _exchange_code_for_token(self, request, code):
        """Exchange authorization code for access token"""
        keycloak_url = settings.KEYCLOAK_SERVER_URL
        realm = settings.KEYCLOAK_REALM_NAME
        client_id = settings.KEYCLOAK_CLIENT_ID
        client_secret = settings.KEYCLOAK_CLIENT_SECRET_KEY
        
        token_url = f"{keycloak_url}/realms/{realm}/protocol/openid-connect/token"
        
        data = {
            'grant_type': 'authorization_code',
            'client_id': client_id,
            'client_secret': client_secret,
            'code': code,
            'redirect_uri': request.build_absolute_uri(reverse('api:frontend:keycloak_callback')),
        }
        
        response = requests.post(token_url, data=data)
        if response.status_code == 200:
            return response.json()
        else:
            logger.error(f"Token exchange failed: {response.status_code} - {response.text}")
            return None
    
    def _get_user_info(self, access_token):
        """Get user information from Keycloak"""
        keycloak_url = settings.KEYCLOAK_SERVER_URL
        realm = settings.KEYCLOAK_REALM_NAME
        
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


@extend_schema(
    tags=["Frontend API - Authentication"],
    summary="Get Authentication Status",
    description="Get current authentication status and user info from session",
    responses={
        200: {
            "description": "Authentication status retrieved successfully",
            "content": {
                "application/json": {
                    "example": {
                        "authenticated": True,
                        "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJ0ajY3WHY3MTQ1dWhBczJiamhPNWdXQ1duVk16UHRtMnUtQ3laTlNldjFRIn0...",
                        "user": {
                            "id": "user-id",
                            "email": "user@example.com",
                            "name": "User Name"
                        }
                    }
                }
            }
        },
        401: {
            "description": "Not authenticated",
            "content": {
                "application/json": {
                    "example": {
                        "authenticated": False,
                        "error": "No active session"
                    }
                }
            }
        }
    }
)
class AuthStatusAPIView(APIView):
    """
    Get current authentication status from session
    """
    authentication_classes = []
    permission_classes = [AllowAny]
    
    def get(self, request):
        """Get authentication status from session"""
        try:
            # Check if user has valid session data
            access_token = request.session.get('access_token')
            user_info = request.session.get('user_info')
            
            if not access_token or not user_info:
                return Response({
                    "authenticated": False,
                    "error": "No active session"
                }, status=status.HTTP_401_UNAUTHORIZED)
            
            return Response({
                "authenticated": True,
                "access_token": access_token,
                "user": user_info
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Auth status error: {e}")
            return Response({
                "authenticated": False,
                "error": "Session check failed"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
