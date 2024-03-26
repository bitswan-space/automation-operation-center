import logging

from django.template.defaultfilters import slugify

from bitswan_backend.core.exceptions import KeycloakMixinUserGroupsGetError
from bitswan_backend.core.services.keycloak import KeycloakService
from bitswan_backend.core.services.keycloak.exceptions import (
    KeycloakServiceUserGroupsGetError,
)

logger = logging.getLogger(__name__)


class KeycloakMixin:
    """
    Mixin to add Keycloak helper methods.
    """

    keycloak = KeycloakService()

    def get_active_user_org_id(self):
        """
        Helper method to get the Keycloak group ID
        """

        try:
            org_id = self.keycloak.get_active_user_org_id(self.request)
            logger.info("Got user group: %s", org_id)
        except KeycloakServiceUserGroupsGetError as e:
            raise KeycloakMixinUserGroupsGetError from e
        else:
            return org_id

    def get_active_user_org_name_slug(self):
        """
        Helper method to get the Keycloak group name slug
        """

        try:
            org_id = self.get_active_user_org_id()
            org = self.keycloak.get_org_by_id(org_id)
            org_name_slug = slugify(org["name"])
            logger.info("Got user group name slug: %s", org_name_slug)

        except KeycloakServiceUserGroupsGetError as e:
            raise KeycloakMixinUserGroupsGetError from e
        else:
            return org_name_slug
