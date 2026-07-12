"""
Comprehensive Model Evaluation Script for Deepfake Detection.

Reports:
  - Per-class accuracy, precision, recall, F1
  - Confusion matrix
  - Worst predictions (highest-confidence misclassifications)
  - Full-image vs face-crop accuracy comparison

Usage:
  python evaluate_model.py [--data-dir dataset] [--model deepfake_model.pth]
"""

import os
import sys
import json
import argparse

import torch
import torch.nn as nn
from torchvision import models, transforms, datasets
from torch.utils.data import DataLoader
from PIL import Image

try:
    from facenet_pytorch import MTCNN
    HAS_MTCNN = True
except ImportError:
    HAS_MTCNN = False
    print("[WARN] facenet-pytorch not installed. Face-crop comparison will be skipped.")

BBOX_EXPANSION = 0.3


def parse_args():
    parser = argparse.ArgumentParser(description="Evaluate deepfake detection model")
    parser.add_argument("--data-dir", type=str, default="dataset", help="Dataset root")
    parser.add_argument("--model", type=str, default="deepfake_model.pth", help="Model path")
    parser.add_argument("--metadata", type=str, default=None, help="Metadata JSON path")
    parser.add_argument("--batch-size", type=int, default=32, help="Batch size")
    parser.add_argument("--num-workers", type=int, default=0, help="DataLoader workers")
    parser.add_argument("--top-k-worst", type=int, default=10, help="Worst predictions to show")
    parser.add_argument("--face-crop-samples", type=int, default=100, help="Samples for face-crop comparison")
    return parser.parse_args()


def load_model_and_metadata(model_path, metadata_path=None, device="cpu"):
    if metadata_path is None:
        metadata_path = model_path.replace(".pth", "_metadata.json")

    fake_idx, real_idx = 0, 1
    idx_to_class = {0: "fake", 1: "real"}

    if os.path.exists(metadata_path):
        with open(metadata_path, "r") as f:
            metadata = json.load(f)
        class_to_idx = metadata.get("class_to_idx", {})
        fake_idx = class_to_idx.get("fake", 0)
        real_idx = class_to_idx.get("real", 1)
        idx_to_class = {v: k for k, v in class_to_idx.items()}
        print(f"[OK] Class mapping: {class_to_idx}")
    else:
        print(f"[WARN] No metadata at {metadata_path}")

    model = models.efficientnet_v2_s(weights=None)
    num_ftrs = model.classifier[-1].in_features
    model.classifier[-1] = nn.Linear(num_ftrs, 2)
    model.load_state_dict(torch.load(model_path, map_location=device))
    model = model.to(device)
    model.eval()

    return model, fake_idx, real_idx, idx_to_class


def evaluate_validation_set(model, data_dir, device, batch_size, num_workers, fake_idx, real_idx, idx_to_class):
    print("\n" + "=" * 60)
    print("  Phase 1: Full Validation Set Evaluation")
    print("=" * 60)

    val_transform = transforms.Compose([
        transforms.Resize(256),
        transforms.CenterCrop(224),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
    ])

    val_dir = os.path.join(data_dir, "val")
    if not os.path.exists(val_dir):
        print(f"[FAIL] Validation directory not found: {val_dir}")
        return None

    val_dataset = datasets.ImageFolder(val_dir, val_transform)
    val_loader = DataLoader(
        val_dataset, batch_size=batch_size, shuffle=False,
        num_workers=num_workers, pin_memory=(device.type == "cuda")
    )

    class_names = val_dataset.classes
    print(f"  Classes: {class_names}")
    print(f"  Dataset class_to_idx: {val_dataset.class_to_idx}")
    print(f"  Validation samples: {len(val_dataset)}")

    all_preds = []
    all_labels = []
    all_probs = []
    all_paths = []

    with torch.no_grad():
        batch_idx = 0
        for inputs, labels in val_loader:
            inputs = inputs.to(device)
            outputs = model(inputs)
            probs = torch.nn.functional.softmax(outputs, dim=1)
            _, preds = torch.max(outputs, 1)

            all_preds.extend(preds.cpu().tolist())
            all_labels.extend(labels.cpu().tolist())
            all_probs.extend(probs.cpu().tolist())

            start_idx = batch_idx * batch_size
            end_idx = start_idx + len(labels)
            for i in range(start_idx, end_idx):
                if i < len(val_dataset.samples):
                    all_paths.append(val_dataset.samples[i][0])
            batch_idx += 1

    return all_preds, all_labels, all_probs, all_paths, class_names, val_dataset.class_to_idx


def compute_metrics(all_preds, all_labels, class_names, class_to_idx):
    num_classes = len(class_names)
    confusion = [[0] * num_classes for _ in range(num_classes)]
    for true, pred in zip(all_labels, all_preds):
        confusion[true][pred] += 1

    metrics = {}
    total_correct = 0
    total_samples = len(all_labels)

    for cls_idx, cls_name in enumerate(class_names):
        tp = confusion[cls_idx][cls_idx]
        fn = sum(confusion[cls_idx]) - tp
        fp = sum(confusion[i][cls_idx] for i in range(num_classes)) - tp
        tn = total_samples - tp - fn - fp

        precision = tp / (tp + fp) if (tp + fp) > 0 else 0.0
        recall = tp / (tp + fn) if (tp + fn) > 0 else 0.0
        f1 = 2 * precision * recall / (precision + recall) if (precision + recall) > 0 else 0.0
        accuracy = (tp + tn) / total_samples if total_samples > 0 else 0.0

        total_correct += tp
        metrics[cls_name] = {
            "accuracy": accuracy, "precision": precision,
            "recall": recall, "f1": f1,
            "tp": tp, "fn": fn, "fp": fp, "support": tp + fn,
        }

    overall_accuracy = total_correct / total_samples if total_samples > 0 else 0.0
    return metrics, confusion, overall_accuracy


def print_metrics(metrics, confusion, overall_accuracy, class_names):
    print(f"\n  Overall Accuracy: {overall_accuracy:.4f} ({overall_accuracy:.1%})")

    print(f"\n  {'Class':<12} {'Accuracy':>10} {'Precision':>10} {'Recall':>10} {'F1':>10} {'Support':>10}")
    print(f"  {'-'*62}")
    for cls_name in class_names:
        m = metrics[cls_name]
        print(f"  {cls_name:<12} {m['accuracy']:>10.4f} {m['precision']:>10.4f} {m['recall']:>10.4f} {m['f1']:>10.4f} {m['support']:>10}")

    print(f"\n  Confusion Matrix:")
    print(f"  {'':>12}", end="")
    for cls_name in class_names:
        print(f" {cls_name:>10}", end="")
    print(f" {'(predicted)':>12}")
    print(f"  {'-'*(12 + 10*len(class_names) + 12)}")
    for i, cls_name in enumerate(class_names):
        print(f"  {cls_name:>12}", end="")
        for j in range(len(class_names)):
            print(f" {confusion[i][j]:>10}", end="")
        print(f" {'(actual)':>12}" if i == 0 else "")


def print_worst_predictions(all_preds, all_labels, all_probs, all_paths, class_names, top_k):
    print(f"\n  Top {top_k} Worst Predictions (highest-confidence misclassifications):")
    print(f"  {'-'*80}")

    misclassifications = []
    for i, (pred, label, probs) in enumerate(zip(all_preds, all_labels, all_probs)):
        if pred != label:
            confidence = max(probs)
            path = all_paths[i] if i < len(all_paths) else "unknown"
            misclassifications.append({
                "path": path, "true_label": class_names[label],
                "pred_label": class_names[pred], "confidence": confidence, "probs": probs,
            })

    misclassifications.sort(key=lambda x: x["confidence"], reverse=True)

    if not misclassifications:
        print("  [OK] No misclassifications found!")
        return

    for i, mc in enumerate(misclassifications[:top_k]):
        prob_str = " | ".join(f"{class_names[j]}={p:.4f}" for j, p in enumerate(mc["probs"]))
        print(f"  {i+1}. [{mc['true_label']}->{mc['pred_label']}] conf={mc['confidence']:.4f}")
        print(f"     {os.path.basename(mc['path'])}")
        print(f"     Probs: {prob_str}")

    total_wrong = len(misclassifications)
    print(f"\n  Total misclassifications: {total_wrong}/{len(all_preds)} ({total_wrong/max(len(all_preds),1):.1%})")


def compare_face_crop_vs_full(model, data_dir, device, fake_idx, real_idx, num_samples):
    if not HAS_MTCNN:
        print("\n  Skipping face-crop comparison (facenet-pytorch not available)")
        return

    if num_samples <= 0:
        return

    print(f"\n{'='*60}")
    print(f"  Phase 2: Full-Image vs Face-Crop Comparison ({num_samples} samples)")
    print(f"{'='*60}")

    mtcnn = MTCNN(keep_all=True, device=device)
    cnn_processor = transforms.Compose([
        transforms.Resize(256),
        transforms.CenterCrop(224),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
    ])

    full_correct = 0
    crop_correct = 0
    faces_found = 0
    total_tested = 0

    for label in ["real", "fake"]:
        val_dir = os.path.join(data_dir, "val", label)
        if not os.path.exists(val_dir):
            continue

        files = sorted([f for f in os.listdir(val_dir) if f.lower().endswith(('.jpg', '.jpeg', '.png'))])
        files = files[:num_samples // 2]
        expected_idx = real_idx if label == "real" else fake_idx

        for filename in files:
            path = os.path.join(val_dir, filename)
            try:
                image = Image.open(path).convert("RGB")
            except Exception:
                continue

            total_tested += 1

            full_tensor = cnn_processor(image).unsqueeze(0).to(device)
            with torch.no_grad():
                output = model(full_tensor)
                probs = torch.nn.functional.softmax(output, dim=1)
                pred = torch.argmax(probs, dim=1).item()
            if pred == expected_idx:
                full_correct += 1

            boxes, _ = mtcnn.detect(image)
            if boxes is not None and len(boxes) > 0:
                faces_found += 1
                box = boxes[0]
                x1, y1, x2, y2 = box
                bw, bh = x2 - x1, y2 - y1
                x1 = max(0, x1 - BBOX_EXPANSION * bw)
                y1 = max(0, y1 - BBOX_EXPANSION * bh)
                x2 = min(image.width, x2 + BBOX_EXPANSION * bw)
                y2 = min(image.height, y2 + BBOX_EXPANSION * bh)
                face = image.crop((x1, y1, x2, y2))

                crop_tensor = cnn_processor(face).unsqueeze(0).to(device)
                with torch.no_grad():
                    output = model(crop_tensor)
                    probs = torch.nn.functional.softmax(output, dim=1)
                    pred = torch.argmax(probs, dim=1).item()
                if pred == expected_idx:
                    crop_correct += 1

    print(f"\n  Results:")
    print(f"  Total tested:        {total_tested}")
    print(f"  Full-image accuracy: {full_correct}/{total_tested} ({full_correct/max(total_tested,1):.1%})")
    print(f"  Faces found:         {faces_found}/{total_tested} ({faces_found/max(total_tested,1):.1%})")
    if faces_found > 0:
        print(f"  Face-crop accuracy:  {crop_correct}/{faces_found} ({crop_correct/max(faces_found,1):.1%})")


def main():
    args = parse_args()
    device = torch.device("cuda:0" if torch.cuda.is_available() else "cpu")

    print(f"{'='*60}")
    print(f"  Deepfake Detection -- Model Evaluation")
    print(f"  Device: {device}")
    print(f"  Model: {args.model}")
    print(f"{'='*60}")

    if not os.path.exists(args.model):
        print(f"\n[FAIL] Model not found: {args.model}")
        print("  Run train.py first to train the model.")
        sys.exit(1)

    model, fake_idx, real_idx, idx_to_class = load_model_and_metadata(
        args.model, args.metadata, device
    )

    result = evaluate_validation_set(
        model, args.data_dir, device, args.batch_size, args.num_workers,
        fake_idx, real_idx, idx_to_class
    )

    if result is not None:
        all_preds, all_labels, all_probs, all_paths, class_names, class_to_idx = result
        metrics, confusion, overall_accuracy = compute_metrics(
            all_preds, all_labels, class_names, class_to_idx
        )
        print_metrics(metrics, confusion, overall_accuracy, class_names)
        print_worst_predictions(all_preds, all_labels, all_probs, all_paths, class_names, args.top_k_worst)

        if overall_accuracy >= 0.90:
            print(f"\n  [OK] TARGET MET: Accuracy {overall_accuracy:.1%} >= 90%")
        else:
            print(f"\n  [FAIL] TARGET NOT MET: Accuracy {overall_accuracy:.1%} < 90%")

    compare_face_crop_vs_full(
        model, args.data_dir, device, fake_idx, real_idx, args.face_crop_samples
    )

    print(f"\n{'='*60}")
    print(f"  Evaluation Complete")
    print(f"{'='*60}")


if __name__ == "__main__":
    main()
