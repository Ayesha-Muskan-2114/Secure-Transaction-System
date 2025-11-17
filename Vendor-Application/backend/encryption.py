import os
import base64
import numpy as np
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.backends import default_backend
from cryptography.hazmat.primitives import padding
from dotenv import load_dotenv

load_dotenv()

class FaceEmbeddingEncryption:
    """AES-256 encryption for face embeddings"""

    def __init__(self, aeskey):
        key_base64 = aeskey
        if not key_base64:
            raise ValueError("AES_KEY_BASE64 not found in environment variables (.env file).")
        
        self.key = base64.b64decode(key_base64)
        if len(self.key) != 32:
            raise ValueError("AES-256 requires a 32-byte key. Check your AES_KEY_BASE64 in .env")

    def encrypt(self, data: bytes) -> str:
        """Encrypt data and return base64 encoded string"""
        iv = os.urandom(16)
        padder = padding.PKCS7(128).padder()
        padded_data = padder.update(data) + padder.finalize()
        
        cipher = Cipher(algorithms.AES(self.key), modes.CBC(iv), backend=default_backend())
        encryptor = cipher.encryptor()
        encrypted_data = encryptor.update(padded_data) + encryptor.finalize()
        
        combined = iv + encrypted_data
        return base64.b64encode(combined).decode('utf-8')

    def decrypt(self, encrypted_base64: str) -> bytes:
        """Decrypt base64 encoded string and return original data"""
        combined = base64.b64decode(encrypted_base64)
        iv, encrypted_data = combined[:16], combined[16:]
        
        cipher = Cipher(algorithms.AES(self.key), modes.CBC(iv), backend=default_backend())
        decryptor = cipher.decryptor()
        padded_data = decryptor.update(encrypted_data) + decryptor.finalize()
        
        unpadder = padding.PKCS7(128).unpadder()
        return unpadder.update(padded_data) + unpadder.finalize()

    def encrypt_embedding(self, embedding_array) -> str:
        """Encrypt numpy array embedding"""
        embedding_bytes = embedding_array.tobytes()
        return self.encrypt(embedding_bytes)

    def decrypt_embedding(self, encrypted_base64: str):
        """Decrypt to numpy array embedding"""
        embedding_bytes = self.decrypt(encrypted_base64)
        return np.frombuffer(embedding_bytes, dtype=np.float32)