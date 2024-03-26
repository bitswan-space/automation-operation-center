import secrets


def generate_secret(length=32):
    """
    Generates a random secret.

    :param length: The length of the secret to generate.
    :return: The generated secret.
    """
    return secrets.token_hex(length)
