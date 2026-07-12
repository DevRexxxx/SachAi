# This Python 3 environment comes with many helpful analytics libraries installed
# It is defined by the kaggle/python Docker image: https://github.com/kaggle/docker-python
# For example, here's several helpful packages to load

import numpy as np # linear algebra
import pandas as pd # data processing, CSV file I/O (e.g. pd.read_csv)

# Input data files are available in the read-only "../input/" directory
# For example, running this (by clicking run or pressing Shift+Enter) will list all files under the input directory

import os
for dirname, _, filenames in os.walk('/kaggle/input'):
    for filename in filenames:
        print(os.path.join(dirname, filename))

# You can write up to 20GB to the current directory (/kaggle/working/) that gets preserved as output when you create a version using "Save & Run All" 
# You can also write temporary files to /kaggle/temp/, but they won't be saved outside of the current session

# ---

import os
import numpy as np
import torch
from torchvision import transforms
from PIL import Image, ImageFilter
import matplotlib.pyplot as plt
import random
import torchvision.transforms.functional as TF
from io import BytesIO
from scipy.fft import dct, idct

# Define a custom class to apply augmentation with a probability
class RandomApply(object):
    def __init__(self, transform, p=0.5):
        self.transform = transform
        self.p = p
        
    def __call__(self, img):
        if random.random() < self.p:
            return self.transform(img)
        return img

# Custom transformation for JPEG compression
class JPEGCompression(object):
    def __init__(self, quality_range=(30, 70)):
        self.quality_range = quality_range
        
    def __call__(self, img):
        quality = random.randint(self.quality_range[0], self.quality_range[1])
        buffer = BytesIO()
        img.save(buffer, format='JPEG', quality=quality)
        buffer.seek(0)
        return Image.open(buffer)

# Custom transformation for random noise
class RandomNoise(object):
    def __init__(self, sigma_range=(0.01, 0.05)):
        self.sigma_range = sigma_range
        
    def __call__(self, img):
        img_np = np.array(img).astype(np.float32) / 255.0
        sigma = random.uniform(self.sigma_range[0], self.sigma_range[1])
        noise = np.random.normal(0, sigma, img_np.shape)
        noisy_img = np.clip(img_np + noise, 0, 1) * 255
        return Image.fromarray(noisy_img.astype(np.uint8))

# Custom transformation for random cropping with scaling
class RandomCropScale(object):
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

# Custom transformation for frequency domain manipulation (DCT drop band)
class FrequencyDropBand(object):
    def __init__(self, bands_to_drop=3):
        self.bands_to_drop = bands_to_drop
        
    def __call__(self, img):
        # Convert to numpy array
        img_np = np.array(img).astype(np.float32)
        
        # Apply DCT to each channel separately
        h, w, c = img_np.shape if len(img_np.shape) == 3 else (*img_np.shape, 1)
        result = np.zeros_like(img_np)
        
        for i in range(c):
            if c == 1:
                channel = img_np
            else:
                channel = img_np[:, :, i]
                
            # Apply DCT
            dct_coeffs = dct(dct(channel.T, norm='ortho').T, norm='ortho')
            
            # Randomly choose bands to drop
            for _ in range(self.bands_to_drop):
                if random.random() < 0.5:  # Horizontal band
                    band_idx = random.randint(0, h-1)
                    dct_coeffs[band_idx, :] = 0
                else:  # Vertical band
                    band_idx = random.randint(0, w-1)
                    dct_coeffs[:, band_idx] = 0
            
            # Apply inverse DCT
            idct_result = idct(idct(dct_coeffs, norm='ortho').T, norm='ortho').T
            
            if c == 1:
                result = idct_result
            else:
                result[:, :, i] = idct_result
        
        # Clip values and convert back to uint8
        result = np.clip(result, 0, 255).astype(np.uint8)
        return Image.fromarray(result if c > 1 else result[:, :, 0])

# Function to demonstrate temporal augmentation by visualizing frame shifts
class TemporalVisualizer:
    def __init__(self, image, max_shift=3):
        self.original_image = image
        self.max_shift = max_shift
    
    def create_simulated_frames(self, num_frames=5):
        """Create simulated frames by slightly shifting the original image"""
        frames = []
        w, h = self.original_image.size
        
        for i in range(num_frames):
            # Create a slightly shifted version of the image
            shift_x = random.randint(-10, 10)
            shift_y = random.randint(-10, 10)
            
            # Apply small random color shifts to simulate different frames
            frame = self.original_image.copy()
            frame = transforms.ColorJitter(brightness=0.1, contrast=0.1, saturation=0.1, hue=0.05)(frame)
            
            # Apply small shift
            frame = transforms.functional.affine(frame, angle=0, translate=(shift_x, shift_y), 
                                               scale=1.0, shear=0, fill=(0,))
            frames.append(frame)
            
        return frames
    
    def apply_temporal_shift(self, frames, shift):
        """Shift frames by a specific amount"""
        if len(frames) <= 1:
            return frames
            
        shifted_frames = []
        for i in range(len(frames)):
            new_idx = (i + shift) % len(frames)
            shifted_frames.append(frames[new_idx])
            
        return shifted_frames
    
    def apply_sequence_randomization(self, frames, randomize_prob=0.05):
        """Randomly shuffle some frames"""
        if len(frames) <= 1:
            return frames
            
        frames_copy = frames.copy()
        num_to_randomize = max(1, int(len(frames_copy) * randomize_prob))
        indices_to_randomize = random.sample(range(len(frames_copy)), num_to_randomize)
        
        for i in range(num_to_randomize):
            idx1 = indices_to_randomize[i]
            idx2 = indices_to_randomize[(i+1) % num_to_randomize]
            frames_copy[idx1], frames_copy[idx2] = frames_copy[idx2], frames_copy[idx1]
            
        return frames_copy
    
    def visualize_temporal_augmentations(self, num_samples=3):
        # Create simulated video frames
        original_frames = self.create_simulated_frames(5)
        
        # Apply temporal shift
        shifted_frames_plus = self.apply_temporal_shift(original_frames.copy(), shift=self.max_shift)
        shifted_frames_minus = self.apply_temporal_shift(original_frames.copy(), shift=-self.max_shift)
        
        # Apply sequence randomization
        randomized_frames = self.apply_sequence_randomization(original_frames.copy(), randomize_prob=0.2)
        
        # Prepare for visualization
        all_frame_sets = [
            ("Original Sequence", original_frames),
            (f"TemporalShift (+{self.max_shift})", shifted_frames_plus),
            (f"TemporalShift (-{self.max_shift})", shifted_frames_minus),
            ("Sequence Randomization (20%)", randomized_frames)
        ]
        
        # Create figure for visualization
        fig, axes = plt.subplots(len(all_frame_sets), len(original_frames), figsize=(15, 12))
        
        # Display each frame set
        for i, (aug_name, frames) in enumerate(all_frame_sets):
            axes[i, 0].set_ylabel(aug_name, fontsize=12, rotation=0, labelpad=100, ha='right')
            
            for j, frame in enumerate(frames):
                # Display the frame
                axes[i, j].imshow(frame)
                axes[i, j].axis('off')
                
                # Mark randomized frames
                if aug_name == "Sequence Randomization (20%)" and j in [1, 3]:  # Simulate randomized indices
                    axes[i, j].set_title("Swapped", fontsize=10, color='red')
                    
                # Add frame number
                if i == 0:  # Only for the first row
                    axes[i, j].set_title(f"Frame {j+1}", fontsize=10)
        
        plt.tight_layout()
        return fig

# Function to display augmentations by category
def display_augmentations_by_category(sample_real_img, sample_fake_img):
    # Dictionary to store augmentation categories
    augmentation_categories = {
        "Spatial": [
            ("Original", transforms.Compose([
                transforms.Resize((224, 224))
            ])),
            ("RandomFlip", transforms.Compose([
                transforms.Resize((224, 224)),
                transforms.RandomHorizontalFlip(p=1.0)
            ])),
            ("RandomRotation", transforms.Compose([
                transforms.Resize((224, 224)),
                transforms.RandomRotation(10)
            ])),
            ("RandomCrop", transforms.Compose([
                transforms.Resize((224, 224)),
                RandomCropScale(scale_range=(0.9, 1.0), size=224)
            ]))
        ],
        
        "Photometric": [
            ("Original", transforms.Compose([
                transforms.Resize((224, 224))
            ])),
            ("ColorJitter (Brightness)", transforms.Compose([
                transforms.Resize((224, 224)),
                transforms.ColorJitter(brightness=0.2)
            ])),
            ("ColorJitter (Contrast)", transforms.Compose([
                transforms.Resize((224, 224)),
                transforms.ColorJitter(contrast=0.2)
            ])),
            ("ColorJitter (Saturation)", transforms.Compose([
                transforms.Resize((224, 224)),
                transforms.ColorJitter(saturation=0.2)
            ])),
            ("GaussianBlur", transforms.Compose([
                transforms.Resize((224, 224)),
                transforms.GaussianBlur(kernel_size=5, sigma=(0.1, 1.5))
            ]))
        ],
        
        "Compression": [
            ("Original", transforms.Compose([
                transforms.Resize((224, 224))
            ])),
            ("JPEG (q=70)", transforms.Compose([
                transforms.Resize((224, 224)),
                JPEGCompression(quality_range=(70, 70))
            ])),
            ("JPEG (q=50)", transforms.Compose([
                transforms.Resize((224, 224)),
                JPEGCompression(quality_range=(50, 50))
            ])),
            ("JPEG (q=30)", transforms.Compose([
                transforms.Resize((224, 224)),
                JPEGCompression(quality_range=(30, 30))
            ])),
            ("Random Noise (σ=0.02)", transforms.Compose([
                transforms.Resize((224, 224)),
                RandomNoise(sigma_range=(0.02, 0.02))
            ])),
            ("Random Noise (σ=0.05)", transforms.Compose([
                transforms.Resize((224, 224)),
                RandomNoise(sigma_range=(0.05, 0.05))
            ]))
        ],
        
        "Spectral": [
            ("Original", transforms.Compose([
                transforms.Resize((224, 224))
            ])),
            ("Frequency DropBand (1 band)", transforms.Compose([
                transforms.Resize((224, 224)),
                FrequencyDropBand(bands_to_drop=1)
            ])),
            ("Frequency DropBand (3 bands)", transforms.Compose([
                transforms.Resize((224, 224)),
                FrequencyDropBand(bands_to_drop=3)
            ])),
            ("Frequency DropBand (5 bands)", transforms.Compose([
                transforms.Resize((224, 224)),
                FrequencyDropBand(bands_to_drop=5)
            ]))
        ]
    }
    
    # Set random seed for reproducibility in visualization
    random.seed(42)
    
    # Process each category
    for category, transforms_list in augmentation_categories.items():
        print(f"\n{category}")
        
        # Create figure for visualization
        fig, axes = plt.subplots(2, len(transforms_list), figsize=(20, 8))
        fig.suptitle(f"{category} Augmentation", fontsize=16)
        
        # Apply each transformation to both real and fake samples
        for j, (transform_name, transform) in enumerate(transforms_list):
            # Process real image
            augmented_real = transform(sample_real_img.copy())
            if isinstance(augmented_real, torch.Tensor):
                augmented_real_np = augmented_real.permute(1, 2, 0).numpy()
                augmented_real_np = augmented_real_np * np.array([0.229, 0.224, 0.225]) + np.array([0.485, 0.456, 0.406])
                augmented_real_np = np.clip(augmented_real_np, 0, 1)
            else:
                augmented_real_np = np.array(augmented_real) / 255.0
            
            # Process fake image
            augmented_fake = transform(sample_fake_img.copy())
            if isinstance(augmented_fake, torch.Tensor):
                augmented_fake_np = augmented_fake.permute(1, 2, 0).numpy()
                augmented_fake_np = augmented_fake_np * np.array([0.229, 0.224, 0.225]) + np.array([0.485, 0.456, 0.406])
                augmented_fake_np = np.clip(augmented_fake_np, 0, 1)
            else:
                augmented_fake_np = np.array(augmented_fake) / 255.0
            
            # Display images
            axes[0, j].imshow(augmented_real_np)
            axes[0, j].set_title(f"{transform_name} (Real)", fontsize=10)
            axes[0, j].axis('off')
            
            axes[1, j].imshow(augmented_fake_np)
            axes[1, j].set_title(f"{transform_name} (Fake)", fontsize=10)
            axes[1, j].axis('off')
        
        plt.tight_layout()
        plt.subplots_adjust(top=0.9)
        plt.savefig(f"{category}_augmentation_samples.png", dpi=300, bbox_inches='tight')
        plt.show()
    
    # Handle Temporal augmentation separately
    print("\nTemporal")
    temporal_vis_real = TemporalVisualizer(sample_real_img)
    temporal_fig_real = temporal_vis_real.visualize_temporal_augmentations()
    temporal_fig_real.suptitle("Temporal Augmentation (Real Sample)", fontsize=16)
    plt.savefig("Temporal_augmentation_real_samples.png", dpi=300, bbox_inches='tight')
    plt.show()
    
    temporal_vis_fake = TemporalVisualizer(sample_fake_img)
    temporal_fig_fake = temporal_vis_fake.visualize_temporal_augmentations()
    temporal_fig_fake.suptitle("Temporal Augmentation (Fake Sample)", fontsize=16)
    plt.savefig("Temporal_augmentation_fake_samples.png", dpi=300, bbox_inches='tight')
    plt.show()

# Function to load sample images from the dataset
def load_sample_images(base_path):
    try:
        # Load a real sample image
        real_dir = os.path.join(base_path, 'train', 'real')
        real_images = [f for f in os.listdir(real_dir) if f.endswith(('.jpg', '.png'))]
        sample_real_path = os.path.join(real_dir, real_images[0])
        sample_real_img = Image.open(sample_real_path).convert('RGB')
        
        # Load a fake sample image
        fake_dir = os.path.join(base_path, 'train', 'fake')
        fake_images = [f for f in os.listdir(fake_dir) if f.endswith(('.jpg', '.png'))]
        sample_fake_path = os.path.join(fake_dir, fake_images[0])
        sample_fake_img = Image.open(sample_fake_path).convert('RGB')
        
        return sample_real_img, sample_fake_img
    
    except Exception as e:
        print(f"Error loading sample images: {e}")
        # Create synthetic images if real images can't be loaded
        real_img = Image.new('RGB', (300, 300), color=(240, 240, 240))
        draw_real = ImageDraw.Draw(real_img)
        draw_real.ellipse([(50, 50), (250, 250)], fill=(180, 180, 180))
        draw_real.text((120, 140), "REAL", fill=(0, 0, 0))
        
        fake_img = Image.new('RGB', (300, 300), color=(240, 240, 240))
        draw_fake = ImageDraw.Draw(fake_img)
        draw_fake.rectangle([(50, 50), (250, 250)], fill=(180, 180, 180))
        draw_fake.text((120, 140), "FAKE", fill=(0, 0, 0))
        
        return real_img, fake_img

# Main execution
def main():
    # Dataset paths
    base_path = '/kaggle/input/1000-videos-split/1000_videos'
    
    # Load sample images
    sample_real_img, sample_fake_img = load_sample_images(base_path)
    
    # Display augmentations by category
    display_augmentations_by_category(sample_real_img, sample_fake_img)
    
    print("\nAugmentasi dilakukan dengan probabilistik (≈0.7/batch) untuk meningkatkan generalization dan robustness terhadap kompresi media sosial.")
    print("\nTabel 3. Data Augmentation")
    print("Kategori\tTransformasi & Rentang\tAlasan")
    print("Spasial\tRandomFlip (p = 0.5), RandomRotation (±10°), RandomCrop (0.9–1.0)\tVariasi pose kepala & framing")
    print("Fotometrik\tColorJitter (brightness/contrast/saturation = 0.2), GaussianBlur (σ = 0.1–1.5)\tMeniru kondisi cahaya & fokus kamera")
    print("Kompresi\tScaling JPEG q = 30–70, RandomNoise (σ = 0.01–0.05)\tMeniru upload–download WhatsApp/IG")
    print("Spektral\tFrequency DropBand (hilangkan pita DCT acak)\tMelemahkan detektor berbasis artefak periodik")
    print("Temporal\tTemporalShift (±3 frame), pengacakan urutan 5 %\tMenghindari ketergantungan kronologi rigid")

if __name__ == "__main__":
    # Import PIL.ImageDraw for synthetic images if needed
    from PIL import ImageDraw
    main()

# ---

