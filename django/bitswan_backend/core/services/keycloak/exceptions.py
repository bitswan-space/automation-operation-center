from keycloak import KeycloakGetError
from keycloak import KeycloakPutError


class KeycloakServiceUserGroupsGetError(KeycloakGetError):
    def __init__(self) -> None:
        super().__init__("Error while updating client")


class KeycloakServiceClientUpdateError(KeycloakPutError):
    def __init__(self) -> None:
        super().__init__("Error while getting user groups")
