import datetime

import jwt


def create_mqtt_token(secret: str, username: str, mountpoint: str = ""):
    """
    Create a JWT token with the given parameters.

    Args:
        secret: The secret key used for encoding
        username: Username to include in the token
        mountpoint: The mountpoint path (defaults to empty string)
        exp_hours: Token expiration time in hours (defaults to 2)

    Returns:
        Encoded JWT token
    """
    exp = datetime.datetime.now(datetime.UTC) + datetime.timedelta(weeks=1000)
    exp_timestamp = int(exp.timestamp())

    payload = {
        "exp": exp_timestamp,
        "username": username,
        "client_attrs": {"mountpoint": mountpoint},
    }

    return jwt.encode(payload, secret, algorithm="HS256")
