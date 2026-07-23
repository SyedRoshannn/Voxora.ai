# ⭐ **Voxora.AI – Intelligent Voice Assistant & Speech Analytics Platform**

Voxora.AI is a premium, interactive full-stack web application designed to capture, transcribe, analyze, and translate voice communications. Built with a decoupled architecture using **React, TypeScript, Vite, TailwindCSS, and Python (FastAPI)**, it provides a clean, secure, and low-latency workspace for managing speech-to-text notes, automated summaries, multi-language translations, and natural vocal playbacks.

Images:
<img width="1920" height="1080" alt="Screenshot 2025-12-22 150827" src="https://github.com/user-attachments/assets/60e080e0-56f2-4285-84be-92deb758c070" />
<img width="1920" height="1080" alt="Screenshot 2026-01-08 193448" src="https://github.com/user-attachments/assets/1f08625b-50e4-4b54-97a4-6d8f90008193" />
<img width="1920" height="1080" alt="Screenshot 2026-01-08 193548" src="https://github.com/user-attachments/assets/fd2ecf16-9f56-45e9-b67e-28fe1923aa57" />
<img width="1920" height="1080" alt="Screenshot 2026-01-08 195431" src="https://github.com/user-attachments/assets/e9707731-f7b4-4ae3-8d05-5f434c36a6af" />
<img width="1920" height="1080" alt="Screenshot 2026-01-08 195836" src="https://github.com/user-attachments/assets/cc411ac7-865d-4874-a92a-e0bae62dd594" />
<img width="1920" height="1080" alt="Screenshot 2025-12-22 152241" src="https://github.com/user-attachments/assets/9a4941c3-c233-47cd-98f3-bdcbad5c099b" />


---

## 🚀 **Core Features**

* 🎤 **Real-Time Speech-to-Text (STT):** Converts live microphone input into written text in real time using native browser Web Speech APIs. Highly accurate and zero-latency capture.
* 🧠 **AI-Powered Summarization:** Condenses long voice recordings or text blocks into structured summaries using the `facebook/bart-large-cnn` sequence-to-sequence model via Hugging Face Inference.
* 🌐 **Multi-Language Translation:** Translates transcriptions into 50+ global languages. Utilizes server-side translation modules and external services (supports major global and regional languages like Arabic, Chinese, French, Spanish, Hindi, Kannada, Tamil, Telugu, and more).
* 🔊 **Natural Text-to-Speech (TTS):** Plays back transcribed text in natural spoken voices via browser SpeechSynthesis, including custom fallback profiles.
* 🗣️ **Intelligent Voice Commands:** Supports hands-free navigation and system control:
  * *"New note"* — Resets the workspace.
  * *"Save note"* / *"Save this"* — Saves the note to your cloud-synced account.
  * *"Clear text"* / *"Clear note"* — Empties the text editor.
  * *"Read notes"* — Reads your latest saved note out loud.
  * *"Delete last note"* — Removes the most recent note entry.
  * *"Delete all notes"* — Deletes all notes.
  * *"Search notes for [keyword]"* — Searches notes for a keyword and reads search results out loud.
  * *"Stop listening"* / *"Stop recording"* — Disables the active microphone.
* 🔐 **User Authentication & Security:** Secure user registration and login pathways. Passwords are encrypted using `pbkdf2_sha256` hashing and API endpoints are guarded with HS256 JWT bearer tokens.
* 📂 **Persistent Note Storage:** Fully managed SQLite database integration storing and syncing user notes chronologically with complete CRUD capabilities.
* 📥 **Vector Document Export:** Exports your notes locally to your device as:
  * **Portable Document Format (PDF):** Generated client-side using `jsPDF` with automatic line-wrapping and multi-page calculations.
  * **Plain Text Document (TXT):** Generated using browser-native Blob endpoints.
* 🔗 **Multi-Platform Content Sharing:** Quick-share menu to instantly copy text to the clipboard or send note content directly to **WhatsApp, Instagram, and Telegram**, or utilize native system share drawers.
* 🎨 **Premium Responsive UI/UX:** Responsive dark mode layout utilizing Tailwind CSS, smooth Framer Motion micro-animations, Radix UI widgets, and a custom visualizer animating microphone amplitude.

---

## 🛠️ **Tech Stack & Architecture**

### **Frontend**
* React 18 (Vite + TypeScript)
* TailwindCSS (Responsive Grid & Flexbox)
* Framer Motion (Transitions & Visualizations)
* TanStack React Query v5 (Declarative caching & server synchronization)
* Radix UI Primitives (Accessible UI widgets)
* jsPDF (Client-side PDF compiler)

### **Backend**
* Python 3.8+
* FastAPI (Asynchronous high-performance API framework)
* SQLAlchemy ORM (Database query mapping)
* Passlib & Python-Jose (Credentials security and JWT cryptography)
* Uvicorn (ASGI web server)

### **Database & Storage**
* SQLite (Local persistent storage via `app.db`)
* Dynamic mapping for production PostgreSQL databases (Neon/Supabase)

---

## ⚙️ **Installation & Local Setup**

### **1. Clone the Repository**
```bash
git clone https://github.com/SyedRoshannn/Voxora.ai.git
cd Voxora.ai/sonic-intel-main/sonic-intel-main
```

### **2. Frontend Setup**
Install package dependencies and start the Vite dev server:
```bash
npm install
npm run dev
```
*Frontend will launch locally (typically at `http://localhost:8080` or `http://localhost:8081`)*

### **3. Backend Setup**
Navigate to the root directory (where `backend/` resides), activate a virtual environment, install requirements, and run the API server:
```bash
# Optional: Create and activate virtual environment
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install requirements
pip install -r backend/requirements.txt

# Run FastAPI backend via Uvicorn on port 8000
python -m uvicorn backend.main:app --port 8000 --reload
```
*Backend will run locally at `http://127.0.0.1:8000` with auto-reload enabled.*

---

## 🔑 **Environment Variables**

Create a `.env` file in the root folder containing the following keys:

```env
# Hugging Face API Token (for AI Summarization)
VITE_HUGGINGFACE_TOKEN=your_huggingface_inference_token

# Frontend API Connectors
VITE_API_BASE_URL=http://127.0.0.1:8000
VITE_API_URL=http://localhost:8000
```

---

## 🚀 **Production Deployment**

### **1. Backend (Render)**
1. Create a **Web Service** on Render.
2. Set Build Command: `pip install -r backend/requirements.txt`
3. Set Start Command: `python -m uvicorn backend.main:app --host 0.0.0.0 --port $PORT`
4. Add Environment Variables:
   * `ALLOWED_ORIGINS` = `https://your-vercel-frontend-domain.vercel.app`
   * `SECRET_KEY` = `your_secure_random_string`
   * `DATABASE_URL` = *(Optional: Connect neon.tech or supabase.co Postgres database string for cloud storage persistence)*

### **2. Frontend (Vercel)**
1. Import the repository into Vercel.
2. Set Framework Preset: `Vite`
3. Build Command: `npm run build`
4. Output Directory: `dist`
5. Add Environment Variables:
   * `VITE_API_BASE_URL` = `https://your-render-backend-url.onrender.com`
   * `VITE_API_URL` = `https://your-render-backend-url.onrender.com`
   * `VITE_HUGGINGFACE_TOKEN` = `your_huggingface_inference_token`

---

## 🧑‍💻 **Author**

**Syed Roshan**
* AI & Full-Stack Web Developer
* LinkedIn: [https://www.linkedin.com/in/syed-roshan-a86857257](https://www.linkedin.com/in/syed-roshan-a86857257)
* GitHub: [https://github.com/SyedRoshannn](https://github.com/SyedRoshannn)

---

## 🔐 **License**
This project is licensed under the **MIT License**.
