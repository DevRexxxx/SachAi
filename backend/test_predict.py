from transformers import AutoImageProcessor, AutoModelForImageClassification
from PIL import Image
import torch
import sys

def predict():
    try:
        image = Image.open('debug_face_crop_0.jpg')
    except Exception as e:
        print("Could not open image:", e)
        sys.exit(1)
        
    print("Loading model...")
    HF_MODEL_ID = "prithivMLmods/Deep-Fake-Detector-v2-Model"
    processor = AutoImageProcessor.from_pretrained(HF_MODEL_ID)
    model = AutoModelForImageClassification.from_pretrained(HF_MODEL_ID)
    model.eval()
    
    print("Processing...")
    inputs = processor(images=image, return_tensors="pt")
    with torch.no_grad():
        outputs = model(**inputs)
        probs = torch.nn.functional.softmax(outputs.logits, dim=1)
        
    print(f"Logits: {outputs.logits}")
    print(f"Probs: {probs}")
    print(f"Labels: {model.config.id2label}")
    
if __name__ == "__main__":
    predict()
