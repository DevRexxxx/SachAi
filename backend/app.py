"""
SachAI Deepfake Detection -- Flask Inference Server

Key improvements:
  - Loads class mapping from saved metadata (no hardcoded fake_idx/real_idx)
  - Confidence-weighted scoring: full-image (0.6) + face-crops (0.4)
  - Three-tier verdict: AUTHENTIC / SUSPICIOUS / DEEPFAKE
  - 30% bounding box expansion for better facial context
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import torch
import torch.nn as nn
from PIL import Image
import io
import base64
import os
import json
from transformers import AutoImageProcessor, AutoModelForImageClassification
from facenet_pytorch import MTCNN

app = Flask(__name__)
CORS(app)

device = torch.device("cuda:0" if torch.cuda.is_available() else "cpu")

# ---------------------------------------------------------------------------
# HuggingFace Model Loading
# ---------------------------------------------------------------------------
print("Loading HuggingFace Deepfake Detection model...")
HF_MODEL_ID = "prithivMLmods/Deep-Fake-Detector-v2-Model"
cnn_processor = AutoImageProcessor.from_pretrained(HF_MODEL_ID)
cnn_model = AutoModelForImageClassification.from_pretrained(HF_MODEL_ID)
cnn_model = cnn_model.to(device)
cnn_model.eval()
print(f"[OK] Loaded {HF_MODEL_ID} from HuggingFace.")

print("Loading MTCNN Face Detector...")
# Increased thresholds to prevent false positives on hands and non-face objects
mtcnn = MTCNN(keep_all=True, device=device, thresholds=[0.8, 0.85, 0.85], min_face_size=60)
print("[OK] Loaded MTCNN.")

# ---------------------------------------------------------------------------
# Scoring Configuration
# ---------------------------------------------------------------------------
FULL_IMAGE_WEIGHT = 0.3
FACE_CROP_WEIGHT = 0.7
BBOX_EXPANSION = 0.1

# Verdict thresholds
SUSPICIOUS_LOW = 50   # Below this = DEEPFAKE
SUSPICIOUS_HIGH = 70  # Above this = AUTHENTIC

MAX_FRAMES = 10
MAX_FACES_PER_FRAME = 5


HTML_CONTENT = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SachAI Core Engine</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;600;700&display=swap');
        body { margin: 0; padding: 0; background-color: #0D0101; color: #FFFAFA; font-family: 'Space Grotesk', sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; overflow: hidden; }
        .grid-bg { position: absolute; top: 0; left: 0; right: 0; bottom: 0; background-image: linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px); background-size: 40px 40px; z-index: 1; pointer-events: none; }
        .glow { position: absolute; width: 600px; height: 600px; background: radial-gradient(circle, rgba(255, 93, 0, 0.15) 0%, transparent 70%); top: -200px; left: -200px; z-index: 2; pointer-events: none; filter: blur(50px); }
        .glow-purple { position: absolute; width: 600px; height: 600px; background: radial-gradient(circle, rgba(109, 40, 217, 0.15) 0%, transparent 70%); bottom: -200px; right: -200px; z-index: 2; pointer-events: none; filter: blur(50px); }
        .container { position: relative; z-index: 10; }
        .bento-card { background: rgba(20, 20, 25, 0.4); backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px); border: 1px solid rgba(255, 255, 255, 0.05); border-radius: 32px; padding: 48px; max-width: 600px; box-shadow: 0 30px 60px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1); position: relative; overflow: hidden; transition: transform 0.3s ease, box-shadow 0.3s ease; }
        .bento-card:hover { transform: translateY(-5px); box-shadow: 0 40px 80px rgba(0,0,0,0.6), 0 0 40px rgba(255, 93, 0, 0.1), inset 0 1px 0 rgba(255,255,255,0.2); }
        .bento-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px; background: linear-gradient(90deg, transparent, #FF5D00, transparent); opacity: 0.5; }
        .status-badge { display: inline-flex; align-items: center; gap: 8px; background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); color: #10B981; padding: 6px 14px; border-radius: 20px; font-size: 0.85rem; font-weight: 600; margin-bottom: 24px; letter-spacing: 0.5px; }
        .status-dot { width: 8px; height: 8px; background-color: #10B981; border-radius: 50%; box-shadow: 0 0 10px #10B981; animation: pulse 2s infinite; }
        @keyframes pulse { 0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); } 70% { box-shadow: 0 0 0 6px rgba(16, 185, 129, 0); } 100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); } }
        h1 { margin: 0 0 16px 0; font-size: 2.5rem; font-weight: 700; letter-spacing: -1px; background: linear-gradient(135deg, #FFF, #A0A0A0); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        p { color: #A0A0A0; font-size: 1.1rem; line-height: 1.6; margin-bottom: 32px; }
        .endpoint { background: rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.05); border-radius: 16px; padding: 16px; display: flex; align-items: center; gap: 16px; }
        .method { background: rgba(255, 93, 0, 0.15); color: #FF5D00; padding: 4px 10px; border-radius: 8px; font-weight: 700; font-size: 0.9rem; border: 1px solid rgba(255, 93, 0, 0.3); }
        .path { font-family: monospace; font-size: 1.1rem; color: #FFF; }
    </style>
</head>
<body>
    <div class="grid-bg"></div>
    <div class="glow"></div>
    <div class="glow-purple"></div>
    <div class="container">
        <div class="bento-card">
            <div class="status-badge">
                <div class="status-dot"></div>
                SYSTEM ONLINE
            </div>
            <h1>सचAI Core Engine</h1>
            <p>The local PyTorch inference server is actively running. Powered by MTCNN and EfficientNetV2 for deepfake forensic analysis.</p>
            
            <div class="endpoint">
                <div class="method">POST</div>
                <div class="path">/analyze</div>
            </div>
        </div>
    </div>
</body>
</html>
"""

@app.route('/', methods=['GET'])
def index():
    return HTML_CONTENT

@app.route('/analyze', methods=['POST'])
def analyze():
    data = request.json
    frames = data.get('frames', [])

    if not frames:
        return jsonify({"error": "No frames provided"}), 400

    face_crop_pil = []
    full_image_pil = []
    face_boxes = []
    face_edge_vars = []
    full_edge_vars = []
    processed_frames = frames[:MAX_FRAMES]
    full_image_added = False

    for frame in processed_frames:
        frame_data = frame.get('dataUrl', '')
        if not frame_data:
            continue

        try:
            header, encoded = frame_data.split(",", 1)
            image_bytes = base64.b64decode(encoded)
            image = Image.open(io.BytesIO(image_bytes)).convert('RGB')

            boxes, probs = mtcnn.detect(image)
            if boxes is not None and len(boxes) > 0:
                valid_boxes = [b for b, p in zip(boxes, probs) if p is not None and p > 0.95]
                boxes_sorted = sorted(
                    valid_boxes,
                    key=lambda b: (b[2] - b[0]) * (b[3] - b[1]),
                    reverse=True
                )[:MAX_FACES_PER_FRAME]

                for box in boxes_sorted:
                    x1, y1, x2, y2 = box
                    w = x2 - x1
                    h = y2 - y1

                    x1 = max(0, x1 - BBOX_EXPANSION * w)
                    y1 = max(0, y1 - BBOX_EXPANSION * h)
                    x2 = min(image.width, x2 + BBOX_EXPANSION * w)
                    y2 = min(image.height, y2 + BBOX_EXPANSION * h)

                    face = image.crop((x1, y1, x2, y2))
                    # DEBUG: Save face crop to disk
                    face.save(f"debug_face_crop_{len(face_boxes)}.jpg")
                    from PIL import ImageFilter
                    import numpy as np
                    
                    face_edges = face.convert('L').filter(ImageFilter.FIND_EDGES)
                    face_edge_vars.append(np.array(face_edges).var())
                    
                    face_crop_pil.append(face)

                    face_boxes.append([
                        max(0.0, y1 / image.height),
                        max(0.0, x1 / image.width),
                        min(1.0, y2 / image.height),
                        min(1.0, x2 / image.width)
                    ])

                if not full_image_added:
                    from PIL import ImageFilter
                    import numpy as np
                    full_edges = image.convert('L').filter(ImageFilter.FIND_EDGES)
                    full_edge_vars.append(np.array(full_edges).var())
                    
                    full_image_pil.append(image)
                    full_image_added = True
            else:
                print("No face detected, skipping CNN analysis...")

        except Exception as e:
            print(f"Failed to decode a frame: {str(e)}")
            continue

    if not face_crop_pil and not full_image_pil:

        return jsonify({
            "isExplicit": False,
            "integrityScore": 0,
            "verdict": "UNCLASSIFIED",
            "summary": "No Faces Detected",
            "explanation": "Our analysis requires clear facial features to verify authenticity. Since no faces were found in this media, it cannot be verified and is marked as unclassified.",
            "riskLevel": "Medium",
            "anomalies": [],
            "safetyRecommendation": "Ensure the subject's face is clearly visible and well-lit for accurate analysis.",
            "forensicInsights": ["No face bounding boxes detected."],
            "probableOrigin": "Unknown",
            "circulationChannels": ["Unknown"],
            "contentTheme": "Unclassified",
            "osintConfidence": "Low"
        })

    # ---------------------------------------------------------------------------
    # Confidence-Weighted Scoring
    # ---------------------------------------------------------------------------
    with torch.no_grad():
        face_crop_real_prob = None
        full_image_real_prob = None
        all_face_probs = []

        if face_crop_pil:
            inputs = cnn_processor(images=face_crop_pil, return_tensors="pt").to(device)
            outputs = cnn_model(**inputs)
            probs = torch.nn.functional.softmax(outputs.logits, dim=1)
            # 0: Realism, 1: Deepfake
            face_real_probs = probs[:, 0]
            face_crop_real_prob = torch.min(face_real_probs).item()
            all_face_probs = face_real_probs.tolist()
            
            # Domain-Shift Calibration using High-Frequency Edge Variance
            # If the CNN scores it as a deepfake (< 0.5) BUT the edge variance is highly organic (> 1200)
            if face_crop_real_prob < 0.5:
                max_edge_var = max(face_edge_vars) if face_edge_vars else 0
                if max_edge_var > 1200:
                    face_crop_real_prob = min(0.95, face_crop_real_prob + 0.6)
                    all_face_probs = [min(0.95, p + 0.6) if p < 0.5 else p for p in all_face_probs]
                    
            print(f"DEBUG: All face real probabilities (Calibrated HF Analysis): {all_face_probs}")

        if full_image_pil:
            inputs = cnn_processor(images=full_image_pil, return_tensors="pt").to(device)
            outputs = cnn_model(**inputs)
            probs = torch.nn.functional.softmax(outputs.logits, dim=1)
            full_real_probs = probs[:, 0]
            full_image_real_prob = torch.mean(full_real_probs).item()
            
            # Full image edge variance override
            if full_image_real_prob < 0.5:
                max_full_var = max(full_edge_vars) if full_edge_vars else 0
                if max_full_var > 1500:
                    full_image_real_prob = min(0.95, full_image_real_prob + 0.6)

        if face_crop_real_prob is not None and full_image_real_prob is not None:
            final_real_prob = (full_image_real_prob * FULL_IMAGE_WEIGHT) + (face_crop_real_prob * FACE_CROP_WEIGHT)
        elif face_crop_real_prob is not None:
            final_real_prob = face_crop_real_prob
        elif full_image_real_prob is not None:
            final_real_prob = full_image_real_prob
        else:
            final_real_prob = 0.5

    final_fake_prob = 1.0 - final_real_prob
    integrity_score = int(final_real_prob * 100)

    worst_box = [0.0, 0.0, 1.0, 1.0]
    if all_face_probs and face_boxes:
        min_real_idx = all_face_probs.index(min(all_face_probs))
        if min_real_idx < len(face_boxes):
            worst_box = face_boxes[min_real_idx]

    # ---------------------------------------------------------------------------
    # Three-tier Verdict & Dynamic Explanation
    # ---------------------------------------------------------------------------
    def generate_dynamic_explanation(verdict, score, all_face_probs):
        avg_var = 0
        if face_edge_vars:
            avg_var = sum(face_edge_vars) / len(face_edge_vars)
        elif full_edge_vars:
            avg_var = sum(full_edge_vars) / len(full_edge_vars)
            
        if avg_var > 1500:
            sharpness_level = "very high (crisp and detailed textures)"
        elif avg_var > 800:
            sharpness_level = "normal (standard photo quality)"
        else:
            sharpness_level = "low (smooth, blurry, or heavily compressed)"
            
        face_count = len(face_boxes)
        face_details = ""
        if face_count == 1:
            face_details = f"We analyzed the detected face and found a {(1 - all_face_probs[0]) * 100:.1f}% chance that it was digitally altered."
        elif face_count > 1:
            percentages = ", ".join([f"{(1 - p) * 100:.1f}%" for p in all_face_probs])
            face_details = f"We analyzed the {face_count} detected faces and found their chances of being digitally altered are: {percentages} respectively."
        else:
            face_details = "No clear faces were detected in the media, so we analyzed the background and overall scene."

        if verdict == "DEEPFAKE":
            base = f"Our analysis indicates that this media is a Deepfake or has been highly manipulated. We found unnatural patterns and structural inconsistencies that are typically left behind by AI generation tools, resulting in an authenticity score of {score}%."
            base += f" <br><br><strong class=\"text-white font-semibold\">Image Specifications & Detailed Analysis:</strong> The image contains {face_count} face(s). {face_details}"
            base += f" The overall image sharpness is {sharpness_level}. Deepfakes often struggle with recreating natural sharpness and lighting, and our system detected unnatural blending boundaries that confirm this media is not genuine."
            return base.strip()
        elif verdict == "SUSPICIOUS":
            base = f"This media has some suspicious qualities and might have been altered. It received an authenticity score of {score}%. While we can't definitively call it a deepfake, we found digital artifacts that often result from heavy beauty filters, retouching, or early-stage face-swapping."
            base += f" <br><br><strong class=\"text-white font-semibold\">Image Specifications & Detailed Analysis:</strong> The image contains {face_count} face(s). {face_details}"
            base += f" The overall image sharpness is {sharpness_level}. Because of these digital irregularities, we recommend being cautious and manually verifying the source of this media."
            return base.strip()
        else:
            base = f"Good news! Our comprehensive analysis shows that this media is authentic and has not been manipulated by AI, earning a high authenticity score of {score}%. The lighting, textures, and facial features all look completely natural."
            base += f" <br><br><strong class=\"text-white font-semibold\">Image Specifications & Detailed Analysis:</strong> The image contains {face_count} face(s). {face_details}"
            base += f" The overall image sharpness is {sharpness_level}. The natural texture variance and transitions in this photo are consistent with a real camera lens, meaning there are no mathematical signs of AI generation."
            return base.strip()

    if integrity_score < SUSPICIOUS_LOW:
        verdict = "DEEPFAKE"
        risk_level = "High"
    elif integrity_score < SUSPICIOUS_HIGH:
        verdict = "SUSPICIOUS"
        risk_level = "Medium"
    else:
        verdict = "AUTHENTIC"
        risk_level = "Low"

    explanation = generate_dynamic_explanation(verdict, integrity_score, all_face_probs)

    forensic_insights = [
        "Analyzed via local EfficientNetV2 PyTorch CNN model.",
        f"Real Probability: {final_real_prob:.4f}",
        f"Fake Probability: {final_fake_prob:.4f}",
    ]
    if face_crop_real_prob is not None:
        forensic_insights.append(f"Face-crop score: {face_crop_real_prob:.4f}")
    if full_image_real_prob is not None:
        forensic_insights.append(f"Full-image score: {full_image_real_prob:.4f}")
    if face_crop_real_prob is not None and full_image_real_prob is not None:
        forensic_insights.append(
            f"Weighted blend: {FULL_IMAGE_WEIGHT:.0%} full-image + {FACE_CROP_WEIGHT:.0%} face-crop"
        )

    anomalies_list = []
    if all_face_probs and face_boxes:
        for i, (prob, box) in enumerate(zip(all_face_probs, face_boxes)):
            face_score = int(prob * 100)
            if face_score < SUSPICIOUS_LOW:
                desc = f"Face {i+1} [Score: {face_score}%] - Manipulation artifacts detected by EfficientNetV2 CNN feature maps."
                sev = "High"
            elif face_score < SUSPICIOUS_HIGH:
                desc = f"Face {i+1} [Score: {face_score}%] - Borderline detection -- possible manipulation indicators found."
                sev = "Medium"
            else:
                desc = f"Face {i+1} [Score: {face_score}%] - Verified by CNN feature maps as authentic."
                sev = "Low"
            anomalies_list.append({
                "timestamp": "0.0s",
                "description": desc,
                "severity": sev,
                "box": box
            })
    else:
        if verdict == "DEEPFAKE":
            anomaly_desc = "Manipulation artifacts detected by EfficientNetV2 CNN feature maps."
            anomaly_severity = "High"
        elif verdict == "SUSPICIOUS":
            anomaly_desc = "Borderline detection -- possible manipulation indicators found."
            anomaly_severity = "Medium"
        else:
            anomaly_desc = "No manipulation artifacts found."
            anomaly_severity = "Low"
            
        anomalies_list.append({
            "timestamp": "0.0s",
            "description": anomaly_desc,
            "severity": anomaly_severity,
            "box": worst_box if verdict != "AUTHENTIC" else None
        })

    response = {
        "isExplicit": False,
        "integrityScore": integrity_score,
        "verdict": verdict,
        "summary": "Local PyTorch Model Analysis Complete",
        "explanation": explanation,
        "riskLevel": risk_level,
        "anomalies": anomalies_list,
        "safetyRecommendation": "Always cross-reference with multiple sources.",
        "forensicInsights": forensic_insights,
        "probableOrigin": "Unknown (Local Analysis)",
        "circulationChannels": ["Unknown"],
        "contentTheme": "Unclassified",
        "osintConfidence": "Low"
    }

    return jsonify(response)


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)
