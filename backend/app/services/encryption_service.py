from cryptography.fernet import Fernet
import json
import os
import base64

class EncryptionService:
    def __init__(self):
        # Get encryption key from environment or generate one
        key = os.getenv("ENCRYPTION_KEY")
        if not key:
            # Generate a key for development (in production, this should be set)
            key = Fernet.generate_key()
            print(f"Generated encryption key: {key.decode()}")
            print("Set ENCRYPTION_KEY environment variable in production!")
        else:
            key = key.encode()
        
        self.cipher_suite = Fernet(key)
    
    def encrypt_credentials(self, credentials: dict) -> str:
        """Encrypt credentials dictionary to string"""
        json_str = json.dumps(credentials)
        encrypted_bytes = self.cipher_suite.encrypt(json_str.encode())
        return base64.b64encode(encrypted_bytes).decode()
    
    def decrypt_credentials(self, encrypted_credentials: str) -> dict:
        """Decrypt credentials string to dictionary"""
        try:
            encrypted_bytes = base64.b64decode(encrypted_credentials.encode())
            decrypted_bytes = self.cipher_suite.decrypt(encrypted_bytes)
            return json.loads(decrypted_bytes.decode())
        except Exception as e:
            raise ValueError(f"Failed to decrypt credentials: {str(e)}")
    
    def update_credentials(self, existing_encrypted: str, new_credentials: dict) -> str:
        """Update existing credentials with new values"""
        try:
            existing = self.decrypt_credentials(existing_encrypted)
            existing.update(new_credentials)
            return self.encrypt_credentials(existing)
        except ValueError:
            # If decryption fails, create new encrypted credentials
            return self.encrypt_credentials(new_credentials)