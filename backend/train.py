"""
Train EfficientNetV2-S for deepfake detection with production-grade techniques.

Key features:
  - Aggressive data augmentation (JPEG compression, noise, resize artifacts, blur)
  - AdamW optimizer with cosine annealing LR schedule
  - Gradual unfreezing: freeze backbone for first N epochs, then fine-tune all layers
  - Early stopping with patience
  - Saves class-to-index mapping alongside model weights for reliable inference
  - Mixed precision training when CUDA is available

Usage:
  python train.py [--epochs 15] [--batch-size 32] [--lr 1e-4] [--freeze-epochs 3]
"""

import os
import sys
import json
import time
import copy
import argparse
import random
import numpy as np

import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader
from torchvision import datasets, models, transforms
from PIL import Image, ImageFilter

# ---------------------------------------------------------------------------
# Custom Augmentation Transforms
# ---------------------------------------------------------------------------

class JPEGCompression:
    """Simulate social-media JPEG re-encoding artifacts."""

    def __init__(self, quality_range=(30, 95)):
        self.quality_range = quality_range

    def __call__(self, img):
        import io
        quality = random.randint(*self.quality_range)
        buffer = io.BytesIO()
        img.save(buffer, format="JPEG", quality=quality)
        buffer.seek(0)
        return Image.open(buffer).convert("RGB")

    def __repr__(self):
        return f"{self.__class__.__name__}(quality={self.quality_range})"


class GaussianNoise:
    """Add Gaussian noise to simulate camera sensor noise."""

    def __init__(self, std_range=(0.01, 0.05)):
        self.std_range = std_range

    def __call__(self, tensor):
        std = random.uniform(*self.std_range)
        noise = torch.randn_like(tensor) * std
        return torch.clamp(tensor + noise, 0.0, 1.0)

    def __repr__(self):
        return f"{self.__class__.__name__}(std={self.std_range})"


class RandomDownscaleUpscale:
    """Simulate the MTCNN crop-then-resize pipeline degradation."""

    def __init__(self, scale_range=(0.5, 0.9)):
        self.scale_range = scale_range

    def __call__(self, img):
        if random.random() < 0.5:
            return img
        scale = random.uniform(*self.scale_range)
        w, h = img.size
        small_size = (max(1, int(w * scale)), max(1, int(h * scale)))
        img = img.resize(small_size, Image.BILINEAR)
        img = img.resize((w, h), Image.BILINEAR)
        return img

    def __repr__(self):
        return f"{self.__class__.__name__}(scale={self.scale_range})"


class RandomCropScale(object):
    """Custom transformation for random cropping with scaling"""
    def __init__(self, scale_range=(0.9, 1.0), size=224):
        self.scale_range = scale_range
        self.size = size
        
    def __call__(self, img):
        scale = random.uniform(self.scale_range[0], self.scale_range[1])
        w, h = img.size
        new_w, new_h = int(w * scale), int(h * scale)
        left = random.randint(0, w - new_w) if w > new_w else 0
        top = random.randint(0, h - new_h) if h > new_h else 0
        img = img.crop((left, top, left + new_w, top + new_h))
        return img.resize((self.size, self.size), Image.BILINEAR)

    def __repr__(self):
        return f"{self.__class__.__name__}(scale={self.scale_range})"


from scipy.fft import dct, idct
class FrequencyDropBand(object):
    """Custom transformation for frequency domain manipulation (DCT drop band)"""
    def __init__(self, bands_to_drop=3):
        self.bands_to_drop = bands_to_drop
        
    def __call__(self, img):
        img_np = np.array(img).astype(np.float32)
        h, w, c = img_np.shape if len(img_np.shape) == 3 else (*img_np.shape, 1)
        result = np.zeros_like(img_np)
        
        for i in range(c):
            channel = img_np if c == 1 else img_np[:, :, i]
            dct_coeffs = dct(dct(channel.T, norm='ortho').T, norm='ortho')
            
            for _ in range(self.bands_to_drop):
                if random.random() < 0.5:
                    band_idx = random.randint(0, h-1)
                    dct_coeffs[band_idx, :] = 0
                else:
                    band_idx = random.randint(0, w-1)
                    dct_coeffs[:, band_idx] = 0
                    
            idct_result = idct(idct(dct_coeffs, norm='ortho').T, norm='ortho').T
            if c == 1:
                result = idct_result
            else:
                result[:, :, i] = idct_result
                
        result = np.clip(result, 0, 255).astype(np.uint8)
        return Image.fromarray(result if c > 1 else result[:, :, 0])

    def __repr__(self):
        return f"{self.__class__.__name__}(bands={self.bands_to_drop})"


# ---------------------------------------------------------------------------
# Argument Parsing
# ---------------------------------------------------------------------------

def parse_args():
    parser = argparse.ArgumentParser(description="Train deepfake detection model")
    parser.add_argument("--data-dir", type=str, default="dataset", help="Dataset root directory")
    parser.add_argument("--epochs", type=int, default=15, help="Total training epochs")
    parser.add_argument("--freeze-epochs", type=int, default=3, help="Epochs to freeze backbone before fine-tuning")
    parser.add_argument("--batch-size", type=int, default=0, help="Batch size (0 = auto-detect based on hardware)")
    parser.add_argument("--lr", type=float, default=1e-4, help="Initial learning rate")
    parser.add_argument("--weight-decay", type=float, default=1e-4, help="AdamW weight decay")
    parser.add_argument("--patience", type=int, default=5, help="Early stopping patience")
    parser.add_argument("--num-workers", type=int, default=0, help="DataLoader workers (0 for Windows compatibility)")
    parser.add_argument("--save-path", type=str, default="deepfake_model.pth", help="Model save path")
    parser.add_argument("--seed", type=int, default=42, help="Random seed")
    parser.add_argument("--resume", action="store_true", help="Resume training from save-path")
    return parser.parse_args()


def set_seed(seed):
    """Set all random seeds for reproducibility."""
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)
    if torch.cuda.is_available():
        torch.cuda.manual_seed_all(seed)


# ---------------------------------------------------------------------------
# Data Transforms
# ---------------------------------------------------------------------------

def get_transforms():
    """Build training and validation transforms."""

    train_transform = transforms.Compose([
        # Spatial augmentations (on PIL Image)
        transforms.RandomResizedCrop(224, scale=(0.75, 1.0), ratio=(0.9, 1.1)),
        transforms.RandomHorizontalFlip(p=0.5),
        transforms.RandomRotation(15),
        transforms.ColorJitter(brightness=0.3, contrast=0.3, saturation=0.3, hue=0.1),

        # Simulate real-world degradation (on PIL Image)
        RandomDownscaleUpscale(scale_range=(0.5, 0.9)),
        transforms.RandomApply([
            RandomCropScale(scale_range=(0.9, 1.0), size=224)
        ], p=0.5),
        transforms.RandomApply([
            FrequencyDropBand(bands_to_drop=3)
        ], p=0.3),
        transforms.RandomApply([
            JPEGCompression(quality_range=(5, 40)),
        ], p=0.8),
        transforms.RandomApply([
            transforms.GaussianBlur(kernel_size=(5, 9), sigma=(1.0, 5.0)),
        ], p=0.5),

        # Convert to tensor
        transforms.ToTensor(),

        # Add heavy noise (on tensor)
        transforms.RandomApply([GaussianNoise(std_range=(0.03, 0.15))], p=0.5),

        # Normalize with ImageNet stats
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
    ])

    val_transform = transforms.Compose([
        transforms.Resize(256),
        transforms.CenterCrop(224),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
    ])

    return {"train": train_transform, "val": val_transform}


# ---------------------------------------------------------------------------
# Model Setup
# ---------------------------------------------------------------------------

def build_model(num_classes, device):
    """Build EfficientNetV2-S with pretrained weights."""
    print("Loading EfficientNetV2-S with ImageNet pretrained weights...")
    model = models.efficientnet_v2_s(weights="DEFAULT")

    # Replace classifier head for binary classification
    num_ftrs = model.classifier[-1].in_features
    model.classifier[-1] = nn.Linear(num_ftrs, num_classes)

    model = model.to(device)
    return model


def freeze_backbone(model):
    """Freeze all layers except the classifier head."""
    for name, param in model.named_parameters():
        if "classifier" not in name:
            param.requires_grad = False
    trainable = sum(p.numel() for p in model.parameters() if p.requires_grad)
    total = sum(p.numel() for p in model.parameters())
    print(f"  Frozen backbone: {trainable:,} / {total:,} params trainable ({trainable/total:.1%})")


def unfreeze_all(model):
    """Unfreeze all layers for full fine-tuning."""
    for param in model.parameters():
        param.requires_grad = True
    trainable = sum(p.numel() for p in model.parameters() if p.requires_grad)
    print(f"  Unfroze all layers: {trainable:,} params trainable")


# ---------------------------------------------------------------------------
# Training Loop
# ---------------------------------------------------------------------------

def train_model(
    model,
    dataloaders,
    dataset_sizes,
    criterion,
    optimizer,
    scheduler,
    device,
    num_epochs,
    freeze_epochs,
    patience,
    save_path,
    class_to_idx,
    start_epoch=0,
    best_acc=0.0,
):
    since = time.time()
    best_model_wts = copy.deepcopy(model.state_dict())
    best_epoch = start_epoch
    epochs_without_improvement = 0

    # Use mixed precision if CUDA is available
    use_amp = device.type == "cuda"
    scaler = torch.amp.GradScaler("cuda") if use_amp else None

    # Start with frozen backbone
    if freeze_epochs > 0 and start_epoch < freeze_epochs:
        print(f"\n  Phase 1: Frozen backbone training (epochs {start_epoch}-{freeze_epochs-1})")
        freeze_backbone(model)
    elif freeze_epochs > 0 and start_epoch >= freeze_epochs:
        print(f"\n  Phase 2: Full fine-tuning resumed")
        unfreeze_all(model)
        optimizer = optim.AdamW(model.parameters(), lr=optimizer.param_groups[0]["lr"] * 0.1, weight_decay=1e-4)
        scheduler = optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=num_epochs - freeze_epochs)
        for _ in range(start_epoch - freeze_epochs):
            scheduler.step()

    for epoch in range(start_epoch, num_epochs):
        # Unfreeze after freeze_epochs
        if epoch == freeze_epochs and freeze_epochs > 0 and start_epoch < freeze_epochs:
            print(f"\n  Phase 2: Full fine-tuning (epochs {freeze_epochs}-{num_epochs-1})")
            unfreeze_all(model)
            # Rebuild optimizer with all parameters
            optimizer = optim.AdamW(model.parameters(), lr=optimizer.param_groups[0]["lr"] * 0.1, weight_decay=1e-4)
            scheduler = optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=num_epochs - freeze_epochs)

        print(f"\nEpoch {epoch}/{num_epochs - 1}")
        print("-" * 40)

        for phase in ["train", "val"]:
            if phase == "train":
                model.train()
            else:
                model.eval()

            running_loss = 0.0
            running_corrects = 0
            batch_count = 0

            for inputs, labels in dataloaders[phase]:
                inputs = inputs.to(device)
                labels = labels.to(device)
                batch_count += 1

                optimizer.zero_grad()

                with torch.set_grad_enabled(phase == "train"):
                    if use_amp and phase == "train":
                        with torch.amp.autocast("cuda"):
                            outputs = model(inputs)
                            loss = criterion(outputs, labels)
                        scaler.scale(loss).backward()
                        scaler.step(optimizer)
                        scaler.update()
                    else:
                        outputs = model(inputs)
                        _, preds = torch.max(outputs, 1)
                        loss = criterion(outputs, labels)
                        if phase == "train":
                            loss.backward()
                            optimizer.step()

                    _, preds = torch.max(outputs, 1)

                running_loss += loss.item() * inputs.size(0)
                running_corrects += torch.sum(preds == labels.data)

                # Progress indicator every 20 batches
                if batch_count % 20 == 0:
                    print(f"    [{phase}] batch {batch_count}...")

            epoch_loss = running_loss / dataset_sizes[phase]
            epoch_acc = running_corrects.double() / dataset_sizes[phase]

            current_lr = optimizer.param_groups[0]["lr"]
            print(f"  {phase:5s} -- Loss: {epoch_loss:.4f}  Acc: {epoch_acc:.4f}  LR: {current_lr:.2e}")

            # Track best model and early stopping
            if phase == "val":
                scheduler.step()

                if epoch_acc > best_acc:
                    best_acc = epoch_acc
                    best_epoch = epoch
                    best_model_wts = copy.deepcopy(model.state_dict())
                    epochs_without_improvement = 0

                    # Save checkpoint
                    _save_model(model, save_path, class_to_idx, best_acc, epoch)
                    print(f"  [OK] New best model saved (acc: {best_acc:.4f})")
                else:
                    epochs_without_improvement += 1
                    print(f"  No improvement for {epochs_without_improvement}/{patience} epochs")

        # Early stopping
        if epochs_without_improvement >= patience:
            print(f"\n[WARN] Early stopping at epoch {epoch} (no improvement for {patience} epochs)")
            break

    time_elapsed = time.time() - since
    print(f"\n{'='*40}")
    print(f"Training complete in {time_elapsed // 60:.0f}m {time_elapsed % 60:.0f}s")
    print(f"Best val accuracy: {best_acc:.4f} at epoch {best_epoch}")

    # Load best model weights
    model.load_state_dict(best_model_wts)
    return model


# ---------------------------------------------------------------------------
# Model Saving
# ---------------------------------------------------------------------------

def _save_model(model, save_path, class_to_idx, best_acc, epoch):
    """Save model weights and class mapping metadata."""
    torch.save(model.state_dict(), save_path)

    metadata = {
        "class_to_idx": class_to_idx,
        "idx_to_class": {str(v): k for k, v in class_to_idx.items()},
        "best_val_accuracy": float(best_acc) if isinstance(best_acc, torch.Tensor) else best_acc,
        "best_epoch": epoch,
        "model_architecture": "efficientnet_v2_s",
        "num_classes": len(class_to_idx),
        "input_size": 224,
        "normalize_mean": [0.485, 0.456, 0.406],
        "normalize_std": [0.229, 0.224, 0.225],
    }

    metadata_path = save_path.replace(".pth", "_metadata.json")
    with open(metadata_path, "w") as f:
        json.dump(metadata, f, indent=2)


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    args = parse_args()
    set_seed(args.seed)

    data_dir = args.data_dir

    if not os.path.exists(data_dir):
        print(f"[FAIL] Dataset directory '{data_dir}' not found.")
        print("  Run `python download_kaggle.py` first.")
        sys.exit(1)

    for split in ["train", "val"]:
        for cls in ["real", "fake"]:
            path = os.path.join(data_dir, split, cls)
            if not os.path.exists(path):
                print(f"[FAIL] Missing directory: {path}")
                sys.exit(1)
            count = len([f for f in os.listdir(path) if os.path.isfile(os.path.join(path, f))])
            if count == 0:
                print(f"[FAIL] Empty directory: {path}")
                sys.exit(1)

    device = torch.device("cuda:0" if torch.cuda.is_available() else "cpu")
    print(f"\n{'='*60}")
    print(f"  Deepfake Detection -- Model Training")
    print(f"  Device: {device}")
    if device.type == "cuda":
        print(f"  GPU: {torch.cuda.get_device_name(0)}")
        print(f"  VRAM: {torch.cuda.get_device_properties(0).total_memory / 1e9:.1f} GB")
    print(f"{'='*60}")

    # Auto-detect batch size
    batch_size = args.batch_size
    if batch_size <= 0:
        if device.type == "cuda":
            vram_gb = torch.cuda.get_device_properties(0).total_memory / 1e9
            batch_size = 32 if vram_gb >= 6 else 16 if vram_gb >= 4 else 8
        else:
            batch_size = 16
    print(f"  Batch size: {batch_size}")

    data_transforms = get_transforms()
    image_datasets = {
        x: datasets.ImageFolder(os.path.join(data_dir, x), data_transforms[x])
        for x in ["train", "val"]
    }
    dataloaders = {
        x: DataLoader(
            image_datasets[x],
            batch_size=batch_size,
            shuffle=(x == "train"),
            num_workers=args.num_workers,
            pin_memory=(device.type == "cuda"),
        )
        for x in ["train", "val"]
    }
    dataset_sizes = {x: len(image_datasets[x]) for x in ["train", "val"]}
    class_names = image_datasets["train"].classes
    class_to_idx = image_datasets["train"].class_to_idx

    print(f"\n  Classes: {class_names}")
    print(f"  Class mapping: {class_to_idx}")
    print(f"  Train: {dataset_sizes['train']} images")
    print(f"  Val:   {dataset_sizes['val']} images")

    # Verify dataset integrity
    print("\n  Verifying dataset integrity...")
    for cls_dir in [os.path.join(data_dir, "train", c) for c in class_names]:
        files = os.listdir(cls_dir)
        if files:
            sample_img_path = os.path.join(cls_dir, files[0])
            img = Image.open(sample_img_path)
            w, h = img.size
            if w < 32 or h < 32:
                print(f"  [WARN] Very small image detected ({w}x{h}): {sample_img_path}")
            else:
                print(f"  [OK] Sample from {os.path.basename(cls_dir)}: {w}x{h}")

    model = build_model(num_classes=len(class_names), device=device)

    start_epoch = 0
    best_acc = 0.0
    if args.resume and os.path.exists(args.save_path):
        print(f"  Resuming from {args.save_path}...")
        model.load_state_dict(torch.load(args.save_path, map_location=device, weights_only=True))
        metadata_path = args.save_path.replace(".pth", "_metadata.json")
        if os.path.exists(metadata_path):
            with open(metadata_path, "r") as f:
                metadata = json.load(f)
                start_epoch = metadata.get("best_epoch", 0) + 1
                best_acc = metadata.get("best_val_accuracy", 0.0)

    criterion = nn.CrossEntropyLoss()
    optimizer = optim.AdamW(
        filter(lambda p: p.requires_grad, model.parameters()),
        lr=args.lr,
        weight_decay=args.weight_decay,
    )
    scheduler = optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=args.epochs)

    print(f"\n  Training for up to {args.epochs} epochs...")
    print(f"  Freeze backbone for first {args.freeze_epochs} epochs")
    print(f"  Early stopping patience: {args.patience}")
    print(f"  Learning rate: {args.lr}")
    print(f"  Weight decay: {args.weight_decay}")

    model = train_model(
        model=model,
        dataloaders=dataloaders,
        dataset_sizes=dataset_sizes,
        criterion=criterion,
        optimizer=optimizer,
        scheduler=scheduler,
        device=device,
        num_epochs=args.epochs,
        freeze_epochs=args.freeze_epochs,
        patience=args.patience,
        save_path=args.save_path,
        class_to_idx=class_to_idx,
        start_epoch=start_epoch,
        best_acc=best_acc,
    )

    _save_model(model, args.save_path, class_to_idx, 0.0, -1)
    print(f"\n[OK] Final model saved to {args.save_path}")
    print(f"[OK] Class metadata saved to {args.save_path.replace('.pth', '_metadata.json')}")


if __name__ == "__main__":
    main()
