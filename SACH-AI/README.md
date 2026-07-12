<p align="center">
  <img src="https://raw.githubusercontent.com/ayush-68789/Sach-AI/main/assets/banner.png" alt="Sach-AI Banner" width="800" />
</p>

<h1 align="center">सचAI (SachAI)</h1>

<p align="center">
  <strong>A premium open-source AI system that acts as a powerful forensic analyzer to detect deepfake images and videos, helping combat digital deception.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/version-4.0.0-blueviolet?style=flat-square" />
  <img src="https://img.shields.io/badge/react-19-61dafb?style=flat-square&logo=react" />
  <img src="https://img.shields.io/badge/typescript-5-3178c6?style=flat-square&logo=typescript" />
  <img src="https://img.shields.io/badge/vite-6-646CFF?style=flat-square&logo=vite" />
  <img src="https://img.shields.io/badge/pytorch-2-EE4C2C?style=flat-square&logo=pytorch" />
  <img src="https://img.shields.io/badge/transformers-4.46-FFD21E?style=flat-square&logo=huggingface" />
</p>

---

## ✨ Overview

**सचAI** (SachAI) is a comprehensive forensic analysis suite designed to detect AI-generated and manipulated media circulating on social platforms. It runs entirely on your local machine with a powerful PyTorch and HuggingFace backend, providing deep image and video inspection, a calibrated authenticity confidence score, and a sleek, premium web interface.

### Key Highlights

- 🔍 **Hybrid AI Forensic Analysis** — Combines a lightweight EfficientNetV2 CNN for probability scoring with a lightning-fast **Dynamic Rule-Based Forensic Engine** for contextual text explanations.
- 🎥 **Video Analysis** — Extracts frames and performs temporal consistency checks on video content.
- 📊 **Confidence Score & Verdict** — Returns an intuitive authenticity probability (Integrity Score) for every analyzed piece of media.
- 💻 **Privacy-First Local Processing** — All analysis is performed completely offline via a Python/Flask backend and local PyTorch models. No APIs, no tracking.
- 🎨 **Dynamic Glassmorphism UI** — Features an interactive, cinematic frontend that changes themes (Green/Yellow/Red) based on the forensic verdict.
- 📄 **PDF Export & OSINT** — Generate detailed, shareable forensic reports, including Probable Origin and Risk Level.

---

## 🏗️ Architecture

SachAI is built with a modern two-tier architecture, separating a highly responsive glassmorphic frontend from a GPU-accelerated ML backend:

```text
┌──────────────────────────────────────────────┐
│             Frontend (React / Vite)          │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌────────┐       │
│  │ UI   │ │ PDF  │ │ i18n │ │ Canvas │       │
│  └──────┘ └──────┘ └──────┘ └────────┘       │
└──────────────────┬───────────────────────────┘
                   │ HTTP POST (Port 5000)
┌──────────────────▼───────────────────────────┐
│            Backend (Flask / Python)          │
│  • Frame Extraction  • ML Inference          │
│  • Anomaly Detection • Verdict Generation    │
└──────────────────┬───────────────────────────┘
                   │ PyTorch / CUDA
┌──────────────────▼───────────────────────────┐
│              Local AI Models                 │
│  • EfficientNetV2 (CNN for Score)            │
│  • Dynamic Rule-Based Explanation Engine     │
└──────────────────────────────────────────────┘
```

### Tech Stack

| Layer | Technology |
|---|---|
| **UI Framework** | React 19 + TypeScript 5 |
| **Styling** | Tailwind CSS + Custom Ambient Animations |
| **Build Tool** | Vite 6 |
| **Backend API** | Flask (Python 3) |
| **ML/Analysis** | PyTorch, torchvision, Transformers (HuggingFace) |
| **Export/Reports**| jspdf + html2canvas |
| **Localization** | i18next + react-i18next |

---

## 📁 Project Structure

```text
SachAi/
├── backend/                         # Local ML Python Backend
│   ├── app.py                       # Flask API Server (Port 5000)
│   ├── deepfake_model.pth           # Local trained CNN model weights
│   ├── requirements.txt             # Python dependencies
│   └── train.py                     # CNN Model training script
└── Sach-AI-main/                    # Main Frontend Application
    ├── index.html                   # Application entry point
    ├── package.json                 # Dependencies & scripts
    ├── App.tsx                      # Main React component & UI layout
    ├── components/                  # Reusable UI components
    ├── hooks/                       # Custom React hooks
    ├── locales/                     # i18n translation files
    ├── services/                    # API and utility services
    └── utils/                       # Helpers and state management
```

---

## 🚀 Features

### 🔍 Deepfake Forensic Analysis

| Feature | Description |
|---|---|
| **🖼 Image Analysis** | Deep inspection of images to find unnatural blending, cloning, and AI synthesis artifacts. |
| **🎥 Video Analysis** | Extracts frames and performs temporal consistency checks to catch deepfakes. |
| **🧠 Forensic Explanation** | Uses a highly-optimized Dynamic Rule-Based Engine to literally "describe" what is wrong with the image in plain English without any VRAM overhead. |

### 🛠️ Advanced Tools & Web Interface

| Tool | Description |
|---|---|
| **🌐 Web Dashboard** | A highly responsive, cinematic interface to easily upload and inspect media files. |
| **🎨 Dynamic Themes** | The UI reacts to the results. Authentic media turns the UI Emerald Green, suspicious media turns it Yellow, and Deepfakes trigger a Crimson Red theme. |
| **⚡ Local API** | Low-latency detection API running on localhost designed for potential mobile app/plugin integrations. |
| **📄 Forensic Reports** | Generate and download detailed text or PDF analysis summaries for investigations. |
| **🌍 Multi-language** | Fully localized interface supporting multiple languages. |

---

## 🛡️ Architecture Optimizations

- **VRAM Management**: The EfficientNetV2 CNN runs in `float32` to avoid `NaN` numerical overflows, while the contextual text is dynamically generated without the massive VRAM footprint of LLMs.

---

## 🔧 Installation & Development

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [Python 3.8+](https://www.python.org/) (with `pip`)
- **CUDA-compatible GPU** (Highly Recommended for VLM inference)

### Setup

```bash
# Clone the repository
git clone https://github.com/DevRexxxx/SachAi.git
cd SachAi
```

### 1. Setup Backend (Local ML Models)
The forensic analysis runs locally on a Python Flask backend on port 5000. It requires downloading model weights on first run.

```bash
cd backend

# Create and activate a virtual environment
python -m venv venv
.\venv\Scripts\activate  # Windows
# source venv/bin/activate  # Mac/Linux

# Install PyTorch and dependencies
pip install -r requirements.txt

# Start the Flask API
python app.py
```
> *Note: On first run, it will automatically use the pre-trained EfficientNet weights.*

### 2. Setup Frontend
In a new terminal window, initialize the React frontend.

```bash
cd Sach-AI-main

# Install dependencies
npm install

# Start the development server
npm run dev
```

Open your browser and navigate to `http://localhost:5173` to view the application.

> **Note**: Ensure the Python backend is running concurrently on port `5000` for the AI forensic analysis to function.

---

## 📝 Version History

| Version | Highlights |
|---|---|
| **v5.0** | **Hybrid Forensic Heuristic & Human-Readable Reports**. Implemented a Domain-Shift Calibration Override using high-frequency spatial edge variance to fix false positives on authentic imagery. Redesigned the technical summary generator to produce highly readable, plain English explanations complete with explicit image specifications. Rebranded UI to V5.0. |
| **v4.0** | **Domain Shift & Inference Optimizations**. Migrated to a dynamic highly-optimized rule-based forensic explanation engine. Solved deepfake mathematical scoring flaw using `torch.min` bounding logic. Fine-tuned the EfficientNetV2 model with extreme dataset augmentations to combat domain shift. Refined MTCNN detection thresholds for heavily compressed TV broadcast inputs. |
| **v3.0** | Huge architectural upgrade. Integrated **Moondream2** (1.8B Vision-Language Model) for generative textual forensic explanations. Fixed FP16/FP32 PyTorch precision bugs. V3.0 branding and new dynamic glassmorphism UI. |
| **v2.0** | Added EfficientNetV2 CNN probability scoring. Local offline backend. Spatial anomaly highlighting and multi-frame video extraction. |
| **v1.0** | Initial release. Basic media uploading, UI framework, PDF exporting, and localization. |

---

## 🤝 Contributing

We welcome contributions to make the web a safer place!

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request describing your changes

---

<p align="center">
  <strong>Built with ❤️ for digital authenticity</strong><br/>
  <em>Protecting users from digital deception.</em>
</p>
