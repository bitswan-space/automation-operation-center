import logging

from django.conf import settings

from bitswan_backend.core.services.keycloak.exceptions import (
    KeycloakServiceClientUpdateError,
)
from bitswan_backend.core.services.keycloak.exceptions import (
    KeycloakServiceUserGroupsGetError,
)
from bitswan_backend.core.utils import encryption
from keycloak import KeycloakAdmin
from keycloak import KeycloakGetError
from keycloak import KeycloakOpenID
from keycloak import KeycloakOpenIDConnection
from keycloak import KeycloakPutError

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
        )
        self.keycloak_connection = KeycloakOpenIDConnection(
            server_url=self.keycloak_server_url,
            realm_name=self.keycloak_realm,
            client_id=self.keycloak_client_id,
            client_secret_key=self.keycloak_client_secret_key,
            verify=True,
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
        try:
            return self.keycloak_admin.get_user_groups(user_id)
        except KeycloakGetError as e:
            raise KeycloakServiceUserGroupsGetError from e

    def validate_token(self, decrypted_token):
        return self.keycloak.introspect(decrypted_token)

    def get_active_user_org_id(self, request):
        user_info = self.get_claims(request)

        user_id = user_info["sub"]

        logger.info("Getting user groups for user: %s", user_id)

        return self.get_user_groups(user_id)[0]["id"]

    def get_org_by_id(self, org_id):
        try:
            return self.keycloak_admin.get_group(org_id)
        except KeycloakGetError as e:
            raise KeycloakServiceUserGroupsGetError from e

    def add_redirect_uri(self, uri):
        try:
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
        except KeycloakPutError as e:
            raise KeycloakServiceClientUpdateError from e

        except KeycloakGetError as e:
            raise KeycloakServiceUserGroupsGetError from e
