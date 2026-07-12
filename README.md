<p align="center">
  <img src="https://raw.githubusercontent.com/ayush-68789/Sach-AI/main/assets/banner.png" alt="Sach-AI Banner" width="800" />
</p>

<h1 align="center">सचAI (SachAI)</h1>

<p align="center">
  <strong>A premium, offline-first deepfake forensic analysis suite powered by local PyTorch models and a stunning, dynamic glassmorphic interface.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/version-4.0.0-blueviolet?style=flat-square" />
  <img src="https://img.shields.io/badge/react-19-61dafb?style=flat-square&logo=react" />
  <img src="https://img.shields.io/badge/typescript-5-3178c6?style=flat-square&logo=typescript" />
  <img src="https://img.shields.io/badge/vite-6-646CFF?style=flat-square&logo=vite" />
  <img src="https://img.shields.io/badge/pytorch-2-EE4C2C?style=flat-square&logo=pytorch" />
  <img src="https://img.shields.io/badge/transformers-4.46-FFD21E?style=flat-square&logo=huggingface" />
  <img src="https://img.shields.io/badge/flask-3-000000?style=flat-square&logo=flask" />
</p>

---

## ✨ Overview

**सचAI (SachAI)** is a comprehensive forensic analysis dashboard designed to detect, highlight, and explain AI-generated manipulations in images and videos. Running entirely on your local hardware for complete privacy, SachAI combines a lightweight, custom-trained **EfficientNetV2 CNN** with a highly-optimized **Dynamic Rule-Based Forensic Engine** to analyze media integrity and instantly generate natural-language forensic explanations of detected manipulation artifacts without heavy GPU VRAM usage.

The interface is built to deliver a premium, high-fidelity experience—employing custom ambient glowing backdrops, futuristic scanline layers, and a dynamic color system that shifts themes based on the forensic integrity rating.

### Key Highlights

- 🧠 **Hybrid Forensic Pipeline** — Combines face-centric CNN probability scoring with a lightning-fast dynamic explanation generator to provide context without massive VRAM overhead.
- 🎥 **Frame Extraction & Temporal Checks** — Extracts and audits individual frames from uploaded video content to locate localized or temporary deepfakes.
- 🎨 **Dynamic Glassmorphic Theme** — A responsive UI that shifts colors dynamically (Emerald Green for Authentic, Yellow for Suspicious, Crimson Red for Deepfakes).
- 🔒 **Absolute Privacy** — Processes all uploaded files completely offline on localhost. No cloud uploads, no API costs, and zero data tracking.
- 📊 **OSINT & Intelligence Reports** — Generates complete forensic summaries including probable origin, risk levels, and automated safety recommendations.
- 📄 **High-Fidelity PDF Exports** — Generates and downloads detailed multi-page PDF analysis reports using `jsPDF` and `html2canvas` for forensic archives.

---

## 🏗️ Architecture

SachAI utilizes a dual-layer local architecture, bridging a responsive Vite-powered frontend with a GPU-accelerated Flask AI API:

```
┌──────────────────────────────────────────────────────┐
│             Frontend (React / Vite)                  │
│  ┌───────────┐ ┌──────────────┐ ┌─────────────────┐  │
│  │ Dashboard │ │ Video frames │ │ Comparison Tool │  │
│  └───────────┘ └──────────────┘ └─────────────────┘  │
│             Vite · Glassmorphism · CSS Glows         │
└──────────────────────────┬───────────────────────────┘
                           │ HTTP POST (Port 5000)
┌──────────────────────────▼───────────────────────────┐
│            Flask API Backend (:5000)                 │
│  /analyze ───────► PyTorch Pipeline                  │
└──────────────────────────┬───────────────────────────┘
                           │
┌──────────────────────────▼───────────────────────────┐
│                 Local PyTorch Models                 │
│  ┌───────────────────────┐ ┌──────────────────────┐  │
│  │ MTCNN Face Detector   │ │ EfficientNetV2 CNN   │  │
│  │ Extracts faces        │ │ Probability scoring  │  │
│  └───────────┬───────────┘ └───────────┬──────────┘  │
│              │ Context                 │ Score       │
│  ┌───────────▼─────────────────────────▼──────────┐  │
│  │ Dynamic Rule-Based Explanation Engine          │  │
│  │ Contextual textual explanation of artifacts    │  │
│  └────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────┘
```

### Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19 · Vite 6 · TypeScript 5 |
| **Styling** | Custom Glassmorphism · Ambient Gradients · Vanilla CSS |
| **Icons** | Lucide Icons |
| **Backend** | Python · Flask · Flask-Cors |
| **ML/Analysis** | PyTorch · torchvision · facenet-pytorch |
| **Forensic Generator** | Highly-Optimized Dynamic Rule-Based Engine |
| **Export/Reports** | jspdf · html2canvas |
| **Localization** | i18next · react-i18next |

---

## 📁 Project Structure

```text
SachAi/
├── backend/                       # Local PyTorch Machine Learning Backend
│   ├── app.py                     # Flask API Server (Port 5000)
│   ├── evaluate_model.py          # Script to evaluate model performance
│   ├── requirements.txt           # Python backend dependencies
│   ├── train.py                   # PyTorch CNN model training script
│   ├── download_kaggle.py         # Utility script to download datasets
│   ├── Dockerfile                 # Docker configuration for backend server
│   └── verify_fix.py              # Script to verify model fixes
│
├── SACH-AI/                       # React Frontend Application
│   ├── index.html                 # Vite HTML entrypoint
│   ├── package.json               # Frontend dependencies & scripts
│   ├── App.tsx                    # Main App dashboard & forensic canvas
│   │
│   ├── components/
│   │   ├── ComparisonTool.tsx     # Double-panel slider for forensic comparison
│   │   ├── VideoProcessor.tsx     # Canvas-based frame extractor & inspector
│   │   └── LanguageSwitcher.tsx   # Localization language selector dropdown
│   │
│   ├── hooks/
│   │   └── useKeyboardShortcuts.ts # Keyboard shortcut mappings hook
│   │
│   ├── locales/                   # Translation dictionaries (EN, HI, etc.)
│   │
│   ├── services/
│   │   ├── geminiService.ts       # API service communicating with Flask (:5000)
│   │   ├── pdfExport.ts           # PDF report generator using jsPDF
│   │   ├── prompts.ts             # Static prompt guides & verification tips
│   │   └── i18n.ts                # Internationalization config
│   │
│   └── utils/
│       └── clipboardUtils.ts      # Copy forensic report helpers
│
├── services/                      # Root level services directory
│   └── pdfExport.ts               # Root PDF export utility
│
├── train/                         # Face dataset folders grouped by emotion
│   ├── angry/
│   ├── disgust/
│   ├── fear/
│   ├── happy/
│   ├── neutral/
│   ├── sad/
│   └── surprise/
│
├── extract.py                     # Script to extract code/models
└── extracted_code.py              # Extracted analysis functions
```

---

## 🚀 Features

### 🖼️ Forensic Analysis Engine

| Feature | Description |
|---|---|
| **Image Forensic Analysis** | Scans uploaded static images for anomalies such as unnatural boundary blending, lighting mismatch, and digital cloning artifacts. |
| **Video Temporal Inspection** | Deconstructs uploaded video files into frames, analyzing each with local models to map authenticity fluctuations over time. |
| **Face-Centric Inspection** | Employs MTCNN to isolate up to 5 individual faces in an image/frame, running focused EfficientNetV2 inspection on target zones to avoid background noise. |
| **Dynamic Forensic Explanation** | Leverages a highly-optimized dynamic rule-based generator to write visual feedback, explaining exactly which elements indicate manipulation. |

### 🎨 Premium UI & OSINT Tools

| Tool | Description |
|---|---|
| **Dynamic Ambient Themes** | The application UI shifts theme based on the analysis verdict: Emerald Green for Authentic, Yellow for Suspicious, Crimson Red for Deepfakes. |
| **Comparison Slider** | Compare original and processed/analyzed frames side-by-side to visually audit deepfake artifacts. |
| **PDF & Text Reports** | Generate and export high-fidelity PDF forensic summaries containing OSINT confidence levels, risk scores, and technical insights. |
| **Privacy-First Safety** | Optional "Hide Media" toggle to blur disturbing or NSFW content during analysis. |
| **Multi-Language Support** | Full internationalization setup supporting English and Hindi (and extensible to others). |

---

## 🧠 AI Pipeline & Backend

### Forensic Pipeline Workflow

```
       Uploaded Image / Video Frame
                    │
                    ▼
       ┌──────────────────────────┐
       │     MTCNN Face Finder    │  Locate & crop up to 5 faces
       └────────────┬─────────────┘
                    │
                    ▼
       ┌──────────────────────────┐
       │    EfficientNetV2 CNN    │  Scoring [Fake, Real]
       └────────────┬─────────────┘
                    │
         Authenticity Score calculated
                    │
                    ▼
       ┌──────────────────────────┐
       │  Dynamic Forensic Engine │  Generate textual visual explanations
       └────────────┬─────────────┘
                    │
                    ▼
       Merged Forensic Verdict JSON
```

### Model Configurations

#### 1. EfficientNetV2 CNN Classifier
- **Architecture**: PyTorch `efficientnet_v2_s` (fine-tuned classifier).
- **Classes**: 2-way output (`[0: Fake, 1: Real]`).
- **Processing**: Inputs are resized to 256px, center-cropped to 224px, and normalized using standard ImageNet values.
- **VRAM Optimizations**: Automatically runs on a CUDA-capable GPU (if present) using `float32` precision to prevent gradient overflow.

#### 2. Dynamic Rule-Based Explanation Engine
- **Architecture**: A lightning-fast, zero-VRAM Python heuristic generator.
- **Processing**: Uses the exact bounding box metadata, bounding box coordinates, and probability scoring from the MTCNN and EfficientNetV2 outputs.
- **Generation**: Dynamically constructs context-aware textual summaries (e.g., highlighting specific manipulated faces) without the massive overhead of a 1.8B parameter LLM.

---

## 🎨 Design System

### Color Palette

| Role | Color | Hex Code | Usage |
|---|---|---|---|
| **Page Background** | Pure Black | `#020204` | Main page background |
| **Idle Glow** | Electric Violet | `#6d28d9` | Idle/startup ambient orb & glow |
| **Authentic Glow** | Emerald Green | `#064e3b` | Authentic verdict theme background |
| **Suspicious Glow** | Warm Amber | `#facc15` | Suspicious verdict theme background |
| **Deepfake Glow** | Crimson Red | `#b91c1c` | Deepfake/Altered verdict theme background |

### Glassmorphism Theme

```css
background: var(--glass);        /* Near-transparent backdrop */
backdrop-filter: blur(40px);      /* Heavy frosted glass blur */
border: 1px solid var(--border);  /* Dynamically colored subtle border */
box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); /* Deep card drop shadow */
```

---

## 🔧 Installation & Local Setup

### Prerequisites

| Tool | Version | Purpose |
|---|---|---|
| [Node.js](https://nodejs.org/) | v18+ | Frontend environment & packaging |
| [Python](https://www.python.org/) | v3.8 - v3.13 | Backend environment & PyTorch ML |
| [CUDA GPU](https://developer.nvidia.com/cuda-toolkit) | 11.8+ (Recommended) | High-speed VLM & CNN model inference |

### 1. Backend Setup (Flask Server)

```bash
# Navigate to the backend directory
cd backend

# Create and activate a Python virtual environment
python -m venv venv
.\venv\Scripts\activate      # On Windows
# source venv/bin/activate   # On macOS/Linux

# Install PyTorch, Transformers, and server packages
pip install -r requirements.txt

# Start the local Flask backend
python app.py
```
> 📦 **Self-Contained Model Storage**:
> - **Default Workspace Caching**: By default, the server stores the EfficientNetV2 weights locally inside the workspace at `backend/` to prevent polluting global directories.
> - **Full Offline Loading**: If you want complete offline capabilities, manually download/clone the `vikhyatk/moondream2` repository into `backend/models/moondream2/`. The backend will automatically detect the local path and load it from there directly without making any external network requests.
> *(Both folders are pre-configured in `.gitignore` to prevent committing model binaries).*

### 2. Frontend Setup (React App)

```bash
# Open a new terminal and navigate to the frontend directory
cd SACH-AI

# Install npm dependencies
npm install

# Start the Vite development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser. Ensure the backend is concurrently running on port `5000`.

---

## 📡 API Reference

### Forensic Analysis API

`POST http://localhost:5000/analyze`

#### Request Payload
```json
{
  "language": "en",
  "frames": [
    {
      "id": 0,
      "timestamp": 0.0,
      "dataUrl": "data:image/jpeg;base64,/9j/4AAQSk..."
    }
  ]
}
```

#### Response Structure
```json
{
  "isExplicit": false,
  "integrityScore": 87,
  "verdict": "AUTHENTIC",
  "summary": "Local PyTorch Model Analysis Complete",
  "explanation": "Our local EfficientNetV2 CNN verified this media as authentic with 87% authenticity.\n\nAI Forensic Analysis: The subject has realistic facial detail. The background contains standard focus blur.",
  "riskLevel": "Low",
  "anomalies": [
    {
      "timestamp": "0.0",
      "description": "No manipulation artifacts found.",
      "severity": "Low"
    }
  ],
  "safetyRecommendation": "Always cross-reference with multiple sources.",
  "forensicInsights": [
    "Analyzed via local EfficientNetV2 PyTorch CNN model.",
    "Fake Probability: 0.1300",
    "Real Probability: 0.8700"
  ],
  "probableOrigin": "Unknown (Local Analysis)",
  "circulationChannels": ["Unknown"],
  "contentTheme": "Unclassified",
  "osintConfidence": "Low"
}
```

---

## 📝 Version History

| Version | Highlights |
|---|---|
| **v4.0.0** | **Domain Shift & Inference Optimizations (Current)**<br/>• Migrated to a dynamic highly-optimized rule-based forensic explanation engine.<br/>• Solved deepfake mathematical scoring flaw using `torch.min` bounding logic.<br/>• Fine-tuned the EfficientNetV2 model with extreme dataset augmentations to combat domain shift.<br/>• Refined MTCNN detection thresholds for heavily compressed TV broadcast inputs. |
| **v3.0.0** | **Generative VLM Core**<br/>• Upgraded engine with **Moondream2 (VLM)** for textual forensic descriptions.<br/>• Solved precision compatibility issues (`float16` for VLM, `float32` for CNN).<br/>• Created the dynamic glassmorphic interface reacting to real-time analysis verdicts. |
| **v2.0.0** | **Offline Scoring Engine**<br/>• Integrated locally trained EfficientNetV2 CNN model for binary classification scoring.<br/>• Set up the MTCNN face detector for automated face cropping and region profiling. |
| **v1.0.0** | **Base Structure**<br/>• Configured the React dashboard, video frame extractor, and pdf reports. |

---

<p align="center">
  <strong>Built with ❤️ for digital authenticity</strong><br/>
  <em>Protecting users from digital deception.</em>
</p>
