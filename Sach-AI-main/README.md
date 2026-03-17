<p align="center">
  <img src="assets/banner.png" alt="Sach-AI Banner">
</p>

# 🚀 Sach-AI
AI-Powered Deepfake Detection System

Brief: Sach-AI is an open-source AI system to detect deepfake images and videos circulating on social media. It provides image/video forensic analysis, a confidence score, and a web interface to upload media for inspection.

Purpose:
- Detect AI-generated images and videos
- Identify deepfake manipulation patterns
- Help prevent scams, misinformation, and non-consensual explicit content

Repository: https://github.com/ayush-68789/Sach-AI

Badges

Place at top of the README (already added above):
- Build/CI (if available)
- License
- GitHub stars
- Open issues

🧠 About Sach-AI

🔍 Sach-AI is an open-source AI system designed to detect deepfake images and videos circulating on social media platforms.

With the rapid rise of AI-generated media, deepfakes are increasingly used for:
- Online scams
- Misinformation campaigns
- Identity manipulation
- Non-consensual explicit content

Sach-AI aims to build technology that can identify manipulated media and protect users from digital deception.

✨ Features

Key features:
- 🔍 Deepfake Detection — AI-based detection system for images and video.
- 🖼 Image Analysis — Detects manipulated images and tweaks at the pixel/semantic level.
- 🎥 Video Analysis — Frame-by-frame forensic inspection and temporal analysis.
- 📊 Confidence Score — Returns an authenticity probability for each analyzed media.
- 🌐 Web Interface — Upload media through the UI for quick checks.
- ⚡ Fast API — Low-latency detection API for integration into apps and browser plugins.

🏗 Tech Stack

Frontend:
- HTML, CSS, JavaScript
- Vite

Backend:
- Node.js, Express.js

AI / Analysis:
- Google Generative AI API (as available)
- Custom frame forensic analysis

(Consider adding versions and Dockerfile if you plan to containerize.

⚙️ Installation

Prerequisites:
- Node.js (LTS)
- npm or yarn

Clone and install:

```bash
# clone
git clone https://github.com/ayush-68789/Sach-AI.git
cd Sach-AI

# install root deps (if any) or per-folder
npm install
# if frontend and backend have their own package.json, run inside each folder
# cd backend && npm install
# cd ../frontend && npm install
```

Environment variables:
Create a `.env` file in backend (example):

```
PORT=5000
GOOGLE_API_KEY=your_google_api_key_here
# any other keys used by analysis pipeline
```

Start locally:

```bash
# from project root
npm start
# or run backend and frontend separately
# cd backend && npm run dev
# cd frontend && npm run dev
```

If using Docker, add Dockerfile and docker-compose to simplify setup.

Environment Variables

Example `.env` (backend):

```
PORT=5000
GOOGLE_API_KEY=your_google_api_key_here
NODE_ENV=development
```

- Keep API keys secret. Use GitHub Secrets for CI and do not commit `.env` to the repo.

Run Locally

1. Install dependencies (see Installation)
2. Set `.env` variables
3. Start backend:

```bash
cd backend
npm run dev # or node server.js
```

4. Start frontend:

```bash
cd frontend
npm run dev
```

Open UI at http://localhost:5173 (or the Vite dev server port) and send requests to the backend at the configured PORT.

🧪 Example API Response

Example: POST /api/analyze (multipart/form-data with `file`)

Request (curl):

```bash
curl -X POST "http://localhost:5000/api/analyze" -F "file=@./sus_image.jpg"
```

Response (JSON):

```json
{
  "label": "Deepfake",
  "confidence": "87%"
}
```

Notes:
- The `label` can be `Deepfake` or `Authentic` (or other categories depending on detection model).
- `confidence` is a calibrated probability indicating the model's belief.

Usage / Examples

JavaScript (fetch):

```javascript
const formData = new FormData();
formData.append('file', fileInput.files[0]);

fetch('http://localhost:5000/api/analyze', {
  method: 'POST',
  body: formData
}).then(r => r.json()).then(console.log);
```

cURL example (same as API section):

```bash
curl -X POST "http://localhost:5000/api/analyze" -F "file=@./sus_image.jpg"
```

🗺 Roadmap (short-term -> long-term)

Short term:
- Improve deepfake image detection accuracy
- Add better logging and test coverage

Medium term:
- Add video deepfake analysis (frame extraction & temporal models)
- Train and integrate a custom ML model
- Browser extension for social media

Long term:
- Mobile app integration
- Real-time deepfake scanner
- Achieve 95–99% detection accuracy

Contributions to any of these items are welcome — see Contributing below.

🤝 Contributing

Thank you for considering contributing! Suggested workflow:

1. Fork repository
2. Create a branch: `git checkout -b feat/short-description`
3. Commit changes with clear messages
4. Push branch to your fork
5. Open a Pull Request describing the change and referencing issues

Please add tests for major changes and follow the project's coding style.

Recommended files to add to repo if not present:
- CONTRIBUTING.md — contribution guidelines
- CODE_OF_CONDUCT.md — community expectations
- .github/ISSUE_TEMPLATE and .github/PULL_REQUEST_TEMPLATE

If you plan to work on a roadmap item, open an issue to discuss the design first.

Running Tests

No test suite is included yet. Recommended:
- Add unit tests for analysis pipeline (Jest/Mocha)
- Add integration tests for API endpoints

Example command (once tests added):

```bash
npm test
```

📜 License

This project is licensed under the MIT License.

See: https://github.com/ayush-68789/Sach-AI/blob/main/LICENSE

© 2026 Ayush Chaurasia

Authors

- Ayush Chaurasia — https://github.com/ayush-68789

Contributors: https://github.com/Aadi768

⭐ Support the Project

If you like the project:

- ⭐ Star the repository: https://github.com/ayush-68789/Sach-AI
- 🍴 Fork the project and submit PRs
- 🤝 Join development or open issues for features/bugs

For questions or feedback, open an issue or contact the author via their GitHub profile.

