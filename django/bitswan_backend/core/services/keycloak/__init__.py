import logging

from django.conf import settings

from bitswan_backend.core.utils import encryption
from keycloak import KeycloakAdmin
from keycloak import KeycloakOpenID
from keycloak import KeycloakOpenIDConnection

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
        token = request.headers.get("authorization", "").split("Bearer ")[-1]

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
        return self.keycloak_admin.get_user_groups(
            user_id=user_id,
            brief_representation=False,
        )

    def validate_token(self, decrypted_token):
        key = self.keycloak.public_key()

        formatted_key = (
            "-----BEGIN PUBLIC KEY-----\n" + key + "\n-----END PUBLIC KEY-----"
        )

        logger.info("Key: %s", key)
        result = self.keycloak.decode_token(
            decrypted_token,
            key=formatted_key,
        )

        logger.info("Result: %s", result)

        return result

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

    def get_active_user_org(self, request):
        user_info = self.get_claims(request)
        user_id = user_info["sub"]

        logger.info("Getting user groups for user: %s", user_id)
        user_keycloak_groups = self.get_user_groups(user_id)

        return self.get_first_group_id_of_type_org(user_keycloak_groups)

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
                "tag_color": next(iter(group["attributes"].get("tag_color", [])), None),
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
            "tag_color": next(iter(org_group["attributes"].get("tag_color", [])), None),
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

    def invite_user_to_org(self, email, org_id):
        user_id = self.keycloak_admin.create_user(
            payload={
                "username": email,
                "email": email,
                "enabled": True,
            },
        )

        self.keycloak_admin.group_user_add(user_id=user_id, group_id=org_id)

        self.keycloak_admin.send_verify_email(
            user_id=user_id,
        )

    def delete_user(self, user_id):
        self.keycloak_admin.delete_user(user_id=user_id)
        logger.info("Deleted user: %s", user_id)
        return user_id

    def get_org_group_mqtt_profiles(self, request):
        active_user_id = self.get_active_user(request)
        org_id = self.get_active_user_org(request)["id"]
        org_groups = self.get_org_groups(org_id=org_id)

        if self.is_admin(request):
            return [
                {
                    "id": f"{org_id}_group_{group['id']}_admin",
                    "name": group["name"],
                    "is_admin": True,
                    "group_id": group["id"],
                }
                for group in org_groups
            ]

        user_group_memberships = self.keycloak_admin.get_user_groups(
            user_id=active_user_id,
            brief_representation=False,
        )

        org_group_user_memberships = [
            group
            for group in user_group_memberships
            if group["id"] in [group["id"] for group in org_groups]
        ]

        return [
            {
                "id": f"{org_id}_group_{group['id']}",
                "name": group["name"],
                "is_admin": False,
                "group_id": group["id"],
            }
            for group in org_group_user_memberships
        ]

    def is_admin(self, request):
        active_user_id = self.get_active_user(request)

        org_id = self.get_active_user_org(request)["id"]
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
