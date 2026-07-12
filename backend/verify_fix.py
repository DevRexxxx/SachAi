"""
Post-fix verification: send known images to the /analyze endpoint and verify verdicts.

Usage:
  python verify_fix.py [--data-dir dataset] [--server http://127.0.0.1:5000]
"""

import base64
import requests
import os
import sys
import argparse
from PIL import Image
import io


def parse_args():
    parser = argparse.ArgumentParser(description="Verify deepfake model via Flask endpoint")
    parser.add_argument("--data-dir", type=str, default="dataset", help="Dataset root")
    parser.add_argument("--server", type=str, default="http://127.0.0.1:5000", help="Server URL")
    parser.add_argument("--max-images", type=int, default=3, help="Max images per class")
    return parser.parse_args()


def test_endpoint(image_path, expected_label, server_url):
    if not os.path.exists(image_path):
        print(f"  [FAIL] File not found: {image_path}")
        return None

    img = Image.open(image_path).convert("RGB")
    buffer = io.BytesIO()
    img.save(buffer, format="JPEG")
    b64 = base64.b64encode(buffer.getvalue()).decode("utf-8")
    data_url = f"data:image/jpeg;base64,{b64}"

    payload = {
        "frames": [{"id": 0, "timestamp": 0.0, "dataUrl": data_url}],
        "language": "en"
    }

    try:
        resp = requests.post(f"{server_url}/analyze", json=payload, timeout=30)
        result = resp.json()

        verdict = result.get("verdict", "UNKNOWN")
        integrity = result.get("integrityScore", -1)
        risk = result.get("riskLevel", "Unknown")

        if expected_label == "REAL":
            correct = verdict in ("AUTHENTIC", "SUSPICIOUS")
        else:
            correct = verdict in ("DEEPFAKE", "SUSPICIOUS")

        icon = "[OK]" if correct else "[FAIL]"
        print(f"  {icon} [{expected_label}] {os.path.basename(image_path)}")
        print(f"    Verdict: {verdict} | Integrity: {integrity}% | Risk: {risk}")
        return correct

    except requests.exceptions.ConnectionError:
        print(f"  [FAIL] Cannot connect to {server_url}")
        print(f"    Start the server with: python app.py")
        return None
    except Exception as e:
        print(f"  [FAIL] [{expected_label}] {os.path.basename(image_path)} -- ERROR: {e}")
        return None


def main():
    args = parse_args()

    print(f"{'='*60}")
    print(f"  End-to-End Verification via /analyze Endpoint")
    print(f"  Server: {args.server}")
    print(f"{'='*60}")

    try:
        requests.get(args.server, timeout=5)
    except requests.exceptions.ConnectionError:
        print(f"\n[FAIL] Server not running at {args.server}")
        print(f"  Start with: python app.py")
        sys.exit(1)
    except Exception:
        pass

    total = 0
    correct = 0

    for label, expected in [("real", "REAL"), ("fake", "FAKE")]:
        val_dir = os.path.join(args.data_dir, "val", label)
        if not os.path.exists(val_dir):
            print(f"\n[WARN] Directory not found: {val_dir}")
            continue

        files = sorted([f for f in os.listdir(val_dir) if f.lower().endswith(('.jpg', '.jpeg', '.png'))])
        files = files[:args.max_images]

        print(f"\n  Testing {expected} images:")
        for filename in files:
            path = os.path.join(val_dir, filename)
            result = test_endpoint(path, expected, args.server)
            if result is not None:
                total += 1
                if result:
                    correct += 1

    print(f"\n{'='*60}")
    if total > 0:
        print(f"  Results: {correct}/{total} correct ({correct/total:.1%})")
        if correct == total:
            print(f"  [OK] ALL TESTS PASSED")
        else:
            print(f"  [WARN] Some tests failed -- review model predictions")
    else:
        print(f"  [FAIL] No tests could be run")
    print(f"{'='*60}")


if __name__ == "__main__":
    main()
