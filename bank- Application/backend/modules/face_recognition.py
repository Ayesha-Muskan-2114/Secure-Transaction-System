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
    """Face recognition using Vision Transformer (ViT) embeddings"""
    
    def __init__(self, device: str = None):
        """Initialize ViT model for feature extraction"""
        self.device = device or ("cuda" if torch.cuda.is_available() else "cpu")
        
        # Load pretrained ViT model from timm
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
        
        print("✓ Vision Transformer Face Recognition model loaded successfully")
    
    def _base64_to_image(self, base64_string: str):
        """Convert base64 string to PIL image"""
        try:
            if ',' in base64_string:
                base64_string = base64_string.split(',')[1]
            image_data = base64.b64decode(base64_string)
            image = Image.open(io.BytesIO(image_data)).convert("RGB")
            return image
        except Exception as e:
            raise ValueError(f"Invalid image data: {e}")
    
    def generate_embedding(self, image_base64: str):
        """
        Generate 768-dimensional embedding from face image
        """
        try:
            img = self._base64_to_image(image_base64)
            img_tensor = self.transform(img).unsqueeze(0).to(self.device)
            with torch.no_grad():
                embedding = self.model(img_tensor)
            embedding = embedding.cpu().numpy().flatten()
            # Normalize embedding
            embedding = embedding / np.linalg.norm(embedding)
            return embedding
        except Exception as e:
            raise ValueError(f"Error generating embedding: {e}")
    
    def calculate_similarity(self, embedding1, embedding2):
        """
        Calculate cosine similarity between two embeddings
        """
        embedding1 = np.array(embedding1)
        embedding2 = np.array(embedding2)
        similarity = cosine_similarity([embedding1], [embedding2])[0][0]
        return float(similarity)
    
    def verify_face(self, image_base64: str, stored_embedding, threshold: float = 0.65):
        """
        Verify if the face in the image matches the stored embedding
        Returns: (is_match: bool, similarity_score: float)
        """
        try:
            current_embedding = self.generate_embedding(image_base64)
            similarity = self.calculate_similarity(current_embedding, stored_embedding)
            is_match = similarity >= threshold
            return is_match, similarity
        except Exception as e:
            raise ValueError(f"Verification failed: {e}")


# Global instance
_face_recognition = None

def get_face_recognition():
    """Get or create face recognition instance"""
    global _face_recognition
    if _face_recognition is None:
        _face_recognition = FaceRecognition()
    return _face_recognition
