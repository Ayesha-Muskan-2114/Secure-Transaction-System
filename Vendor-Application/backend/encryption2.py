# backend/encryption2.py

import os
import base64
from dotenv import load_dotenv
from cryptography.hazmat.primitives import serialization, hashes
from cryptography.hazmat.primitives.asymmetric import padding

load_dotenv()

def safe_b64decode(data: str) -> bytes:
    """Decode a base64 string safely, fixing missing padding."""
    data = data.strip().replace(" ", "").replace("\n", "")
    missing = len(data) % 4
    if missing:
        data += "=" * (4 - missing)
    return base64.b64decode(data)

class PinRSAEncryptor:
    """RSA encryption/decryption for FacePay PINs"""

    def __init__(self):
        # Load and decode private key
        private_key_b64 = os.getenv("RSA_PRIVATE_KEY_BASE64")
        if not private_key_b64:
            raise ValueError("RSA_PRIVATE_KEY_BASE64 not found in .env")
        try:
            private_bytes = base64.b64decode(private_key_b64)
            self.private_key = serialization.load_pem_private_key(
                private_bytes,
                password=None
            )
        except Exception as e:
            raise ValueError(f"Failed to load private key: {str(e)}")

        # Load and decode public key
        public_key_b64 = os.getenv("RSA_PUBLIC_KEY_BASE64")
        if not public_key_b64:
            raise ValueError("RSA_PUBLIC_KEY_BASE64 not found in .env")
        try:
            public_bytes = base64.b64decode(public_key_b64)
            self.public_key = serialization.load_pem_public_key(public_bytes)
        except Exception as e:
            raise ValueError(f"Failed to load public key: {str(e)}")

    def encrypt_pin(self, pin: str) -> str:
        """Encrypt a PIN using the public key and return a base64 string."""
        if not pin or not pin.isdigit():
            raise ValueError("PIN must be a numeric string")
        pin_bytes = pin.encode()
        try:
            ciphertext = self.public_key.encrypt(
                pin_bytes,
                padding.OAEP(
                    mgf=padding.MGF1(algorithm=hashes.SHA256()),
                    algorithm=hashes.SHA256(),
                    label=None
                )
            )
            return base64.b64encode(ciphertext).decode()
        except Exception as e:
            raise ValueError(f"PIN encryption failed: {str(e)}")

    def decrypt_pin(self, ciphertext_b64: str) -> str:
        """Decrypt a base64-encrypted PIN using the private key."""
        try:
            ciphertext = safe_b64decode(ciphertext_b64)
            key_size_bytes = self.private_key.key_size // 8
            if len(ciphertext) != key_size_bytes:
                raise ValueError(
                    f"Ciphertext length {len(ciphertext)} does not match key size {key_size_bytes}"
                )

            decrypted_bytes = self.private_key.decrypt(
                ciphertext,
                padding.OAEP(
                    mgf=padding.MGF1(algorithm=hashes.SHA256()),
                    algorithm=hashes.SHA256(),
                    label=None
                )
            )
            return decrypted_bytes.decode()
        except Exception as e:
            raise ValueError(f"PIN decryption failed: {str(e)}")