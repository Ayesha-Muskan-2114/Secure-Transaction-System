# encryption2.py
import os
import base64
from dotenv import load_dotenv
from cryptography.hazmat.primitives import serialization, hashes
from cryptography.hazmat.primitives.asymmetric import padding

load_dotenv()


class PinRSAEncryptor:
    """
    RSA encryption/decryption for FacePay PINs
    """

    def __init__(self):
        # Load private key (for decryption)
        private_key_b64 = os.getenv("RSA_PRIVATE_KEY_BASE64")
        if not private_key_b64:
            raise ValueError("RSA_PRIVATE_KEY_BASE64 not found in .env")

        self.private_key = serialization.load_pem_private_key(
            base64.b64decode(private_key_b64),
            password=None
        )

        # Load public key (for encryption)
        public_key_b64 = os.getenv("RSA_PUBLIC_KEY_BASE64")
        if not public_key_b64:
            raise ValueError("RSA_PUBLIC_KEY_BASE64 not found in .env")

        self.public_key = serialization.load_pem_public_key(
            base64.b64decode(public_key_b64)
        )

    def encrypt_pin(self, pin: str) -> str:
        """
        Encrypt a PIN using the public key and return base64 string
        """
        pin_bytes = pin.encode()
        ciphertext = self.public_key.encrypt(
            pin_bytes,
            padding.OAEP(
                mgf=padding.MGF1(algorithm=hashes.SHA256()),
                algorithm=hashes.SHA256(),
                label=None
            )
        )
        return base64.b64encode(ciphertext).decode()

    def decrypt_pin(self, ciphertext_b64: str) -> str:
        """
        Decrypt a base64-encoded ciphertext using private key and return plaintext PIN
        """
        ciphertext = base64.b64decode(ciphertext_b64)
        decrypted_bytes = self.private_key.decrypt(
            ciphertext,
            padding.OAEP(
                mgf=padding.MGF1(algorithm=hashes.SHA256()),
                algorithm=hashes.SHA256(),
                label=None
            )
        )
        return decrypted_bytes.decode()


# ------------------------------
# Optional test
# ------------------------------
if __name__ == "__main__":
    encryptor = PinRSAEncryptor()
    test_pin = input("Enter a PIN to test: ").strip()
    encrypted = encryptor.encrypt_pin(test_pin)
    print("Encrypted PIN (base64):", encrypted)
    decrypted = encryptor.decrypt_pin(encrypted)
    print("Decrypted PIN:", decrypted)
