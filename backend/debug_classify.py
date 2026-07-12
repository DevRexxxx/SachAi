"""
Debug classification script -- tests model predictions on known real/fake images.

Uses the saved class mapping from training metadata.
Tests both full-image and face-crop predictions.

Usage:
  python debug_classify.py [--data-dir dataset] [--model deepfake_model.pth]
"""

import os
import sys
import json
import argparse
import torch
import torch.nn as nn
from torchvision import models, transforms
from PIL import Image
from facenet_pytorch import MTCNN

BBOX_EXPANSION = 0.3


def parse_args():
    parser = argparse.ArgumentParser(description="Debug deepfake model predictions")
    parser.add_argument("--data-dir", type=str, default="dataset", help="Dataset root")
    parser.add_argument("--model", type=str, default="deepfake_model.pth", help="Model path")
    parser.add_argument("--metadata", type=str, default=None, help="Metadata JSON path")
    parser.add_argument("--max-images", type=int, default=5, help="Max images per class to test")
    return parser.parse_args()


def load_model_and_metadata(model_path, metadata_path=None, device="cpu"):
    if metadata_path is None:
        metadata_path = model_path.replace(".pth", "_metadata.json")

    fake_idx, real_idx = 0, 1
    if os.path.exists(metadata_path):
        with open(metadata_path, "r") as f:
            metadata = json.load(f)
        class_to_idx = metadata.get("class_to_idx", {})
        fake_idx = class_to_idx.get("fake", 0)
        real_idx = class_to_idx.get("real", 1)
        print(f"[OK] Loaded class mapping: fake={fake_idx}, real={real_idx}")
    else:
        print(f"[WARN] No metadata at {metadata_path}, using default: fake=0, real=1")

    model = models.efficientnet_v2_s(weights=None)
    num_ftrs = model.classifier[-1].in_features
    model.classifier[-1] = nn.Linear(num_ftrs, 2)
    model.load_state_dict(torch.load(model_path, map_location=device))
    model = model.to(device)
    model.eval()

    return model, fake_idx, real_idx


def test_image(image_path, expected_label, model, cnn_processor, mtcnn, fake_idx, real_idx, device):
    if not os.path.exists(image_path):
        print(f"  [FAIL] File not found: {image_path}")
        return None

    image = Image.open(image_path).convert("RGB")
    w, h = image.size

    results = {"path": image_path, "expected": expected_label, "size": f"{w}x{h}"}

    # Full-image prediction
    input_tensor = cnn_processor(image).unsqueeze(0).to(device)
    with torch.no_grad():
        output = model(input_tensor)
        probs = torch.nn.functional.softmax(output, dim=1)

    full_fake = probs[0][fake_idx].item()
    full_real = probs[0][real_idx].item()
    full_pred = "REAL" if full_real > full_fake else "FAKE"
    full_correct = (full_pred == expected_label)

    results["full_image"] = {
        "fake_prob": full_fake, "real_prob": full_real,
        "prediction": full_pred, "correct": full_correct,
    }

    # Face-crop prediction
    boxes, _ = mtcnn.detect(image)
    if boxes is not None and len(boxes) > 0:
        box = boxes[0]
        x1, y1, x2, y2 = box
        bw, bh = x2 - x1, y2 - y1
        x1 = max(0, x1 - BBOX_EXPANSION * bw)
        y1 = max(0, y1 - BBOX_EXPANSION * bh)
        x2 = min(image.width, x2 + BBOX_EXPANSION * bw)
        y2 = min(image.height, y2 + BBOX_EXPANSION * bh)
        face = image.crop((x1, y1, x2, y2))

        face_tensor = cnn_processor(face).unsqueeze(0).to(device)
        with torch.no_grad():
            output = model(face_tensor)
            probs = torch.nn.functional.softmax(output, dim=1)

        crop_fake = probs[0][fake_idx].item()
        crop_real = probs[0][real_idx].item()
        crop_pred = "REAL" if crop_real > crop_fake else "FAKE"
        crop_correct = (crop_pred == expected_label)

        results["face_crop"] = {
            "fake_prob": crop_fake, "real_prob": crop_real,
            "prediction": crop_pred, "correct": crop_correct,
        }
    else:
        results["face_crop"] = None

    return results


def print_result(result):
    status_icon = "[OK]" if result["full_image"]["correct"] else "[FAIL]"

    print(f"\n{status_icon} [{result['expected']}] {os.path.basename(result['path'])} ({result['size']})")
    fi = result["full_image"]
    correct_str = "[OK]" if fi["correct"] else "[FAIL] WRONG"
    print(f"  Full-image  -> Fake: {fi['fake_prob']:.4f}  Real: {fi['real_prob']:.4f}  -> {fi['prediction']} {correct_str}")

    fc = result.get("face_crop")
    if fc:
        correct_str = "[OK]" if fc["correct"] else "[FAIL] WRONG"
        print(f"  Face-crop   -> Fake: {fc['fake_prob']:.4f}  Real: {fc['real_prob']:.4f}  -> {fc['prediction']} {correct_str}")
    else:
        print(f"  Face-crop   -> No face detected")


def main():
    args = parse_args()
    device = torch.device("cuda:0" if torch.cuda.is_available() else "cpu")

    print(f"{'='*60}")
    print(f"  Deepfake Model -- Debug Classification")
    print(f"  Device: {device}")
    print(f"{'='*60}")

    model, fake_idx, real_idx = load_model_and_metadata(args.model, args.metadata, device)

    cnn_processor = transforms.Compose([
        transforms.Resize(256),
        transforms.CenterCrop(224),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
    ])

    mtcnn = MTCNN(keep_all=True, device=device)

    total_correct_full = 0
    total_correct_crop = 0
    total_tested = 0
    total_faces_found = 0

    for label in ["real", "fake"]:
        val_dir = os.path.join(args.data_dir, "val", label)
        if not os.path.exists(val_dir):
            print(f"\n[WARN] Validation directory not found: {val_dir}")
            continue

        files = sorted([f for f in os.listdir(val_dir) if f.lower().endswith(('.jpg', '.jpeg', '.png'))])
        files = files[:args.max_images]

        expected = label.upper()
        print(f"\n{'-'*40}")
        print(f"  Testing {len(files)} {expected} images from val set")
        print(f"{'-'*40}")

        for filename in files:
            path = os.path.join(val_dir, filename)
            result = test_image(path, expected, model, cnn_processor, mtcnn, fake_idx, real_idx, device)
            if result:
                print_result(result)
                total_tested += 1
                if result["full_image"]["correct"]:
                    total_correct_full += 1
                if result.get("face_crop"):
                    total_faces_found += 1
                    if result["face_crop"]["correct"]:
                        total_correct_crop += 1

    print(f"\n{'='*60}")
    print(f"  Summary")
    print(f"{'='*60}")
    print(f"  Total tested:       {total_tested}")
    print(f"  Full-image correct: {total_correct_full}/{total_tested} ({total_correct_full/max(total_tested,1):.1%})")
    print(f"  Faces found:        {total_faces_found}/{total_tested}")
    if total_faces_found > 0:
        print(f"  Face-crop correct:  {total_correct_crop}/{total_faces_found} ({total_correct_crop/max(total_faces_found,1):.1%})")


if __name__ == "__main__":
    main()
