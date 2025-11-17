"""
Face Recognition Module using Vision Transformer (ViT)
Handles face embedding generation and verification
"""

import torch
import torchvision.transforms as transforms
from PIL import Image
import io
import base64
import numpy as np
import timm
from sklearn.metrics.pairwise import cosine_similarity


class FaceRecognition:
    """Face recognition using Vision Transformer (ViT)"""

    def __init__(self, device: str = None):

        self.device = device or ("cuda" if torch.cuda.is_available() else "cpu")

        # Load pretrained ViT model
        self.model = timm.create_model("vit_base_patch16_224", pretrained=True)
        self.model.head = torch.nn.Identity()  # Remove classification head
        self.model.eval()
        self.model.to(self.device)

        # Image preprocessing
        self.transform = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize(
                mean=(0.485, 0.456, 0.406),
                std=(0.229, 0.224, 0.225)
            )
        ])

        print("✓ ViT Face Recognition Model Loaded")

    # ---------------------------------------------------------
    # Base64 → PIL Image
    # ---------------------------------------------------------
    def _decode_base64_image(self, image_base64: str):
        try:
            # Remove prefix (data:image/jpeg;base64,...)
            if "base64," in image_base64:
                image_base64 = image_base64.split("base64,")[1]

            image_bytes = base64.b64decode(image_base64)

            return Image.open(io.BytesIO(image_bytes)).convert("RGB")

        except Exception as e:
            raise ValueError(f"Invalid or corrupt base64 image: {e}")

    # ---------------------------------------------------------
    # Generate embedding
    # ---------------------------------------------------------
    def generate_embedding(self, image_base64: str):
        try:
            img = self._decode_base64_image(image_base64)
            img_tensor = self.transform(img).unsqueeze(0).to(self.device)

            with torch.no_grad():
                embedding = self.model(img_tensor)

            embedding = embedding.cpu().numpy().flatten()

            # Normalize embedding
            embedding = embedding / np.linalg.norm(embedding)

            return embedding

        except Exception as e:
            raise ValueError(f"Failed to generate embedding: {e}")

    # ---------------------------------------------------------
    # Cosine Similarity
    # ---------------------------------------------------------
    def get_similarity(self, emb1, emb2):
        emb1 = np.array(emb1).reshape(1, -1)
        emb2 = np.array(emb2).reshape(1, -1)

        return float(cosine_similarity(emb1, emb2)[0][0])

    # ---------------------------------------------------------
    # Verify face
    # ---------------------------------------------------------
    def verify_face(self, image_base64: str, stored_embedding, threshold=0.65):
        try:
            new_embedding = self.generate_embedding(image_base64)

            similarity = self.get_similarity(new_embedding, stored_embedding)

            match = similarity >= threshold

            return match, similarity

        except Exception as e:
            raise ValueError(f"Verification failed: {e}")


# ---------------------------------------------------------
# GLOBAL INSTANCE
# ---------------------------------------------------------
_face_recognition = None

def get_face_recognition():
    global _face_recognition
    if _face_recognition is None:
        _face_recognition = FaceRecognition()
    return _face_recognition
