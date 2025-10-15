import json
import logging
import secrets
import string

from django.conf import settings
from keycloak import KeycloakAdmin
from keycloak import KeycloakOpenID
from keycloak import KeycloakOpenIDConnection
from keycloak import KeycloakPostError
from keycloak.exceptions import KeycloakError

from bitswan_backend.core.utils import encryption

logger = logging.getLogger(__name__)


class KeycloakService:
    _instance = None

    def __new__(cls):
        if not cls._instance:
            cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self):
        self.keycloak_server_url = settings.KEYCLOAK_SERVER_URL
        self.keycloak_realm = settings.KEYCLOAK_REALM_NAME
        self.keycloak_client_id = settings.KEYCLOAK_CLIENT_ID
        self.keycloak_client_secret_key = settings.KEYCLOAK_CLIENT_SECRET_KEY
        self.auth_secret_key = settings.AUTH_SECRET_KEY

        self.keycloak = KeycloakOpenID(
            server_url=self.keycloak_server_url,
            client_id=self.keycloak_client_id,
            realm_name=self.keycloak_realm,
            client_secret_key=self.keycloak_client_secret_key,
            timeout=120,
        )
        self.keycloak_connection = KeycloakOpenIDConnection(
            server_url=self.keycloak_server_url,
            realm_name=self.keycloak_realm,
            client_id=self.keycloak_client_id,
            client_secret_key=self.keycloak_client_secret_key,
            verify=True,
            timeout=120,
        )

        self.keycloak_admin = KeycloakAdmin(connection=self.keycloak_connection)

    def get_claims(self, request):
        auth_header = request.headers.get("authorization", "")
        if not auth_header.startswith("Bearer "):
            logger.error("Invalid authorization header format: %s", auth_header)
            return None
            
        token = auth_header.split("Bearer ")[-1]
        if not token:
            logger.error("No token found in authorization header")
            return None
            
        logger.info("Extracted token: %s", token[:50] + "..." if len(token) > 50 else token)
        return self.validate_token(token)

    def decrypt_token(self, encrypted_token, iv, tag):
        auth_secret_key = self.auth_secret_key

        return encryption.decrypt_token(
            token=encrypted_token,
            secret=auth_secret_key,
            iv=iv,
            tag=tag,
        )

    def get_user_groups(self, user_id):
        try:
            return self.keycloak_admin.get_user_groups(
                user_id=user_id,
                brief_representation=False,
            )
        except Exception:
            logger.exception("Failed to get user groups:")
            # Try to refresh token explicitly
            token = self.keycloak.token(
                grant_type=["client_credentials"],
            )
            self.keycloak_connection.token = token
            # Retry the operation
            return self.keycloak_admin.get_user_groups(
                user_id=user_id,
                brief_representation=False,
            )

    def validate_token(self, token):
        try:
            # Get the public key from Keycloak
            public_key = self.keycloak.public_key()
            
            # Format the public key for use with decode_token
            formatted_public_key = f"-----BEGIN PUBLIC KEY-----\n{public_key}\n-----END PUBLIC KEY-----"
            
            logger.info("Token length: %d", len(token))
            logger.info("Token starts with: %s", token[:20] if len(token) > 20 else token)
            
            result = self.keycloak.decode_token(
                token,
                key=formatted_public_key,
            )

            logger.info("Token validation successful")
            return result
        except Exception as e:
            logger.error("Token validation failed: %s", str(e))
            logger.error("Token content: %s", token)
            return None

    def get_keycloak_org_groups(self, keycloak_groups):
        return [
            group
            for group in keycloak_groups
            if (
                "type" in group.get("attributes", {})
                and "org" in group["attributes"]["type"]
            )
        ]

    def get_first_group_id_of_type_org(self, keycloak_groups):
        """
        Returns the first group's ID where the 'type' attribute contains 'org'.

        :param keycloak_groups: List of keycloak groups (each as a dictionary)
        :return: ID of the first matching organization, or None if not found
        """
        for group in keycloak_groups:
            if (
                "type" in group.get("attributes", {})
                and "org" in group["attributes"]["type"]
            ):
                logger.info("Found org group: %s", group)
                return group
        return None

    def get_active_user(self, request):
        user_info = self.get_claims(request)
        return user_info["sub"]

    def get_active_user_org(self, request) -> dict[str, any] | None:
        """
        Get the active user's organization from the X-Org-Id header.
        This is the correct approach as the frontend explicitly sets the active org.
        """
        try:
            org_id = request.headers.get("X-Org-Id")
            org_name = request.headers.get("X-Org-Name")
            
            if not org_id:
                logger.warning("No X-Org-Id header found in request")
                return None
                
            if not org_name:
                logger.warning("No X-Org-Name header found in request")
                return None
            
            # Validate that the user is actually a member of this org
            user_info = self.get_claims(request)
            user_id = user_info.get("sub")
            
            if not user_id:
                logger.warning("User ID not found in token")
                return None
            
            # Get user groups to verify membership
            try:
                user_groups = self.get_user_groups(user_id)
                user_group_paths = [group.get("path", "") for group in user_groups]
            except Exception as e:
                logger.error("Failed to get user groups: %s", str(e))
                return None
            
            # Check if user is a member of the specified org
            expected_org_path = f"/{org_name}"
            if expected_org_path not in user_group_paths:
                logger.warning("User %s is not a member of org %s", user_id, org_name)
                return None
            
            # Get the org details to return
            org = self.get_org_by_id(org_id)
            if not org or org.get("name") != org_name:
                logger.warning("Org %s not found or name mismatch", org_id)
                return None
                
            logger.info("Active user org: %s (%s)", org_name, org_id)
            return org
            
        except Exception as e:
            logger.exception("Failed to get active user org: %s", str(e))
            return None

    def get_active_user_orgs(self, request):
        try:
            user_info = self.get_claims(request)
            user_id = user_info["sub"]
            user_keycloak_groups = self.get_user_groups(user_id)

            if not user_keycloak_groups:
                logger.warning("No groups found for user: %s", user_id)
                return []

            return self.get_keycloak_org_groups(user_keycloak_groups)
        except Exception:
            logger.exception("Failed to get active user orgs:")
            raise

    def get_user_org_id(self, token):
        try:
            user_info = self.validate_token(token)
            user_id = user_info["sub"]
            user_groups = self.get_user_groups(user_id)
            org_group = self.get_first_group_id_of_type_org(user_groups)
            return org_group["id"]
        except Exception:
            logger.exception("Failed to get user org ID:")
            raise

    def get_org_by_id(self, org_id):
        return self.keycloak_admin.get_group(org_id)

    def add_redirect_uri(self, uri):
        client_id = self.keycloak_admin.get_client_id(
            client_id=self.keycloak_client_id,
        )

        client = self.keycloak_admin.get_client(client_id=client_id)
        logger.info("keycloak_client_id: %s", self.keycloak_client_id)

        client.update({"redirectUris": [uri] + client["redirectUris"]})

        return self.keycloak_admin.update_client(
            client_id=client_id,
            payload=client,
        )

    def get_org_groups(self, org_id):
        org_groups = self.keycloak_admin.get_group(group_id=org_id)["subGroups"]
        logger.info("Got org groups: %s", org_groups)

        return [
            {
                "id": group["id"],
                "name": group["name"],
                "path": group.get("path", ""),
                "tag_color": next(iter(group["attributes"].get("tag_color", [])), None),
                "permissions": group["attributes"].get("permissions", []),
                "description": next(
                    iter(group["attributes"].get("description", [])),
                    None,
                ),
                "nav_items": next(
                    iter(group["attributes"].get("nav_items", [])),
                    None,
                )
                or [],
            }
            for group in org_groups
        ]

    def delete_group(self, group_id):
        return self.keycloak_admin.delete_group(group_id)

    def create_group(self, org_id, name, attributes):
        res = self.keycloak_admin.create_group(
            payload={
                "name": name,
                "attributes": attributes,
            },
            parent=org_id,
            skip_exists=True,
        )
        logger.info("Created group: %s", res)

        # If skip_exists=True and group already exists, res will be None
        # In that case, we need to find the existing group and return its ID
        if res is None:
            # Get all groups under the org to find the existing group
            org_groups = self.keycloak_admin.get_group(group_id=org_id)["subGroups"]
            for group in org_groups:
                if group["name"] == name:
                    logger.info("Found existing group: %s", group["id"])
                    return group["id"]
            
            # If we still can't find it, log an error
            logger.error("Group %s not found after creation attempt", name)
            return None

        return res

    def create_org(self, name, attributes):
        res = self.keycloak_admin.create_group(
            payload={
                "name": name,
                "attributes": attributes,
            },
        )

        return res

    def update_org_group(self, group_id, name, attributes):
        res = self.keycloak_admin.update_group(
            group_id=group_id,
            payload={
                "name": name,
                "attributes": attributes,
            },
        )
        logger.info("Updated group: %s", res)

        return res

    def get_org_group(self, group_id):
        org_group = self.keycloak_admin.get_group(group_id=group_id)

        return {
            "id": org_group["id"],
            "name": org_group["name"],
            "path": org_group.get("path", ""),
            "tag_color": next(iter(org_group["attributes"].get("tag_color", [])), None),
            "permissions": org_group["attributes"].get("permissions", []),
            "description": next(
                iter(org_group["attributes"].get("description", [])),
                None,
            ),
        }

    def get_org_users(self, org_id):
        users = self.keycloak_admin.get_group_members(group_id=org_id)
        org_groups = self.get_org_groups(org_id=org_id)

        org_groups_dict = {}
        for group in org_groups:
            org_groups_dict[group["id"]] = {
                "id": group["id"],
                "name": group["name"],
                "tag_color": (group.get("tag_color", None)),
                "permissions": (group.get("permissions", [])),
                "description": (group.get("description", None)),
            }

        user_org_group_memberships = []

        for user in users:
            logger.info("User: %s", user)

            user_group_memberships = self.keycloak_admin.get_user_groups(
                user_id=user["id"],
                brief_representation=False,
            )

            user_org_group_memberships.append(
                {
                    "id": user["id"],
                    "email": user["email"],
                    "username": user["username"],
                    "verified": user["emailVerified"],
                    "groups": [
                        org_groups_dict[group["id"]]
                        for group in user_group_memberships
                        if group["id"] in org_groups_dict
                    ],
                },
            )

        return user_org_group_memberships

    def add_user_to_org_group(self, user_id, org_group_id):
        return self.keycloak_admin.group_user_add(
            user_id=user_id,
            group_id=org_group_id,
        )

    def remove_user_from_org_group(self, user_id, org_group_id):
        return self.keycloak_admin.group_user_remove(
            user_id=user_id,
            group_id=org_group_id,
        )

    def find_user_by_email(self, email):
        """
        Find a user by email address.
        Returns the user ID if found, None otherwise.
        """
        try:
            users = self.keycloak_admin.get_users(query={"email": email})
            if users:
                return users[0]["id"]
            return None
        except Exception as e:
            logger.exception("Failed to find user by email: %s", email)
            return None

    def generate_temporary_password(self, length=12):
        """
        Generate a secure temporary password.
        """
        # Use a mix of letters, digits, and symbols
        characters = string.ascii_letters + string.digits + "!@#$%^&*"
        password = ''.join(secrets.choice(characters) for _ in range(length))
        return password

    def invite_user_to_org(self, email, org_id):
        """
        Invite a user to an organization.
        Returns a dict with invitation status and temporary password if email failed.
        """
        result = {
            "success": True,
            "email_sent": False,
            "temporary_password": None,
            "user_id": None
        }
        
        try:
            # Try to find if user already exists
            user_id = self.find_user_by_email(email)
            
            if user_id:
                self.keycloak_admin.group_user_add(user_id=user_id, group_id=org_id)
                result["user_id"] = user_id
                result["email_sent"] = True  # Existing user, assume they can log in
            else:
                # Create user without password first
                user_id = self.keycloak_admin.create_user(
                    payload={
                        "username": email,
                        "email": email,
                        "enabled": True,
                    },
                )

                self.keycloak_admin.group_user_add(user_id=user_id, group_id=org_id)
                result["user_id"] = user_id

                # Try to send email with password reset
                try:
                    self.keycloak_admin.send_update_account(
                        user_id=user_id,
                        payload=[
                            "UPDATE_PASSWORD",
                            "VERIFY_EMAIL",
                        ],
                        lifespan=172800,
                    )
                    logger.info("Email sent successfully to user: %s", email)
                    result["email_sent"] = True
                except (KeycloakError, Exception) as e:
                    logger.warning("Failed to send email to user %s: %s", email, str(e))
                    # Email failed, generate temporary password and recreate user with password
                    temp_password = self.generate_temporary_password()
                    try:
                        # Delete the user without password
                        self.keycloak_admin.delete_user(user_id)
                        
                        # Recreate user with temporary password
                        user_id = self.keycloak_admin.create_user(
                            payload={
                                "username": email,
                                "email": email,
                                "enabled": True,
                                "credentials": [{
                                    "type": "password",
                                    "value": temp_password,
                                    "temporary": True
                                }]
                            },
                        )
                        
                        # Add user back to group
                        self.keycloak_admin.group_user_add(user_id=user_id, group_id=org_id)
                        result["user_id"] = user_id
                        result["email_sent"] = False
                        result["temporary_password"] = temp_password
                        
                    except Exception as recreate_error:
                        logger.error("Failed to recreate user with password for %s: %s", email, str(recreate_error))
                        result["email_sent"] = False
                        result["temporary_password"] = None
                        result["success"] = False
        except Exception as e:
            logger.exception("Unexpected error in invite_user_to_org for %s: %s", email, str(e))
            result["success"] = False
            result["email_sent"] = False
            result["temporary_password"] = None

        return result

    def delete_user(self, user_id):
        self.keycloak_admin.delete_user(user_id=user_id)
        logger.info("Deleted user: %s", user_id)
        return user_id

    def get_user_org_groups(self, request, org_id):
        active_user_id = self.get_active_user(request)
        org_groups = self.get_org_groups(org_id=org_id)

        # Return all groups if user is admin
        if self.is_admin(request):
            return org_groups

        user_group_memberships = self.keycloak_admin.get_user_groups(
            user_id=active_user_id,
            brief_representation=False,
        )

        return [
            group
            for group in user_group_memberships
            if group["id"] in [group["id"] for group in org_groups]
        ]

    def is_admin(self, request):
        active_user_id = self.get_active_user(request)

        org_id = self.get_active_user_org(request).get("id")
        org_groups = self.get_org_groups(org_id=org_id)

        user_group_memberships = self.keycloak_admin.get_user_groups(
            user_id=active_user_id,
            brief_representation=False,
        )

        # groups only in org_groups
        org_group_user_memberships = [
            group
            for group in user_group_memberships
            if group["id"] in [group["id"] for group in org_groups]
        ]

        return any(
            group["name"].lower() == "admin" for group in org_group_user_memberships
        )

    def get_admin_org_group(self, org_id):
        org_groups = self.get_org_groups(org_id=org_id)
        return next((group for group in org_groups if group["name"].lower() == "admin"), None)

    def is_group_member(self, user_id, group_id):
        user_group_memberships = self.keycloak_admin.get_user_groups(
            user_id=user_id,
            brief_representation=False,
        )

        return group_id in [group["id"] for group in user_group_memberships]

    def get_token_from_token(self, request):
        # TODO: change scope if needed
        token = request.headers.get("Authorization", "").split("Bearer ")[-1]
        return self.keycloak.exchange_token(
            token=token,
        )

    def get_orgs(self):
        groups = self.keycloak_admin.get_groups(query={"briefRepresentation": "false"})
        return [
            group
            for group in groups
            if (
                "type" in group.get("attributes", {})
                and "org" in group["attributes"]["type"]
            )
        ]

    def is_global_superadmin(self, user_id):
        """
        Check if a user is in the GlobalSuperAdmin group.
        
        Args:
            user_id: Keycloak user ID
            
        Returns:
            bool: True if user is in GlobalSuperAdmin group, False otherwise
        """
        try:
            # Get the GlobalSuperAdmin group ID from settings
            global_superadmin_group_id = settings.KEYCLOAK_GLOBAL_SUPERADMIN_GROUP_ID
            
            if not global_superadmin_group_id:
                logger.warning("KEYCLOAK_GLOBAL_SUPERADMIN_GROUP_ID not configured")
                return False
            
            user_groups = self.get_user_groups(user_id)
            
            for group in user_groups:
                if group.get('id') == global_superadmin_group_id:
                    logger.info(f"User {user_id} is in GlobalSuperAdmin group")
                    return True
                    
            logger.info(f"User {user_id} is not in GlobalSuperAdmin group")
            return False
            
        except Exception as e:
            logger.exception(f"Failed to check GlobalSuperAdmin membership for user {user_id}: {e}")
            return False

    def is_email_verified(self, user_id):
        """
        Check if a user's email is verified in Keycloak.
        
        Args:
            user_id: Keycloak user ID
            
        Returns:
            bool: True if email is verified, False otherwise
        """
        try:
            user = self.keycloak_admin.get_user(user_id)
            email_verified = user.get('emailVerified', False)
            logger.info(f"User {user_id} email verified: {email_verified}")
            return email_verified
            
        except Exception as e:
            logger.exception(f"Failed to check email verification for user {user_id}: {e}")
            return False
