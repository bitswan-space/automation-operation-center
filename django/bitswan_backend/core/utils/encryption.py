import base64

from cryptography.hazmat.backends import default_backend
from cryptography.hazmat.primitives.ciphers import Cipher
from cryptography.hazmat.primitives.ciphers import algorithms
from cryptography.hazmat.primitives.ciphers import modes


def decrypt_token(token, secret, iv, tag):
    iv = base64.b64decode(iv)
    tag = base64.b64decode(tag)
    ciphertext = base64.b64decode(token)

    secret_bytes = base64.b64decode(secret)

    decryptor = Cipher(
        algorithms.AES(secret_bytes),
        modes.GCM(iv, tag),
        default_backend(),
    ).decryptor()

    decrypted_token = decryptor.update(ciphertext) + decryptor.finalize()

    return decrypted_token.decode("utf-8")
