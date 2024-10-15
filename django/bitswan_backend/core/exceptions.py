from rest_framework import exceptions


class TokenExpiredOrInvalid(exceptions.AuthenticationFailed):
    def __init__(self) -> None:
        super().__init__("expired or invalid token")
