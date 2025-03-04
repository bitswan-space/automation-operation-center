import secrets


def generate_secret():
    """Generate a random secret similar to mcookie"""
    return secrets.token_hex(16)
