# Elevate - AI-Powered Adaptive Learning Platform

Elevate is a cutting-edge, 3D-enabled AI learning assistant designed to revolutionize how students study. By leveraging Google's Gemini models, it transforms static content into interactive study plans, generates real-time diagrams and videos, and predicts academic performance through immersive simulations.

![Elevate Hero](https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=1200&auto=format&fit=crop)

## 🚀 Key Features

### 🧠 Intelligent Chat & Tutoring
*   **Deep Reasoning Mode**: Toggles `gemini-3-pro-preview` with a high thinking budget to solve complex STEM problems step-by-step.
*   **Persistent History**: Chat sessions are saved locally, allowing students to pick up where they left off.
*   **Mermaid.js Integration**: Automatically converts algorithmic explanations into visual flowcharts.
*   **Multi-modal Support**: Generates diagrams, maps, and 3D concept visualizations on demand.

### 🎙️ Voice Tutor (Gemini Live)
*   **Real-time Conversation**: Low-latency voice interaction using the Gemini Live API (`gemini-2.5-flash-native-audio`).
*   **Hands-free Learning**: Perfect for revision while commuting or performing other tasks.
*   **Natural Voice Output**: Uses high-quality prebuilt voices (e.g., Zephyr).

### 📚 AI Study Manager
*   **PDF-to-Curriculum**: Upload a chapter PDF, and the system parses it to generate:
    *   **Executive Summaries**: Concise overviews of the material.
    *   **Key Concepts**: Extracted core topics.
    *   **Smart Notes**: Auto-generated Mind Map structures (Markdown) and Flashcards (Front/Back).
    *   **Practice Tests**: Custom MCQs, Short Answer, and Numerical questions.
*   **Mistake Pattern Analysis**: Analyzes quiz performance to identify specific learning gaps (e.g., "Concept Gap", "Calculation Error") and suggests fixes.

### ⏳ Time-Travel Mode (Exam Simulation)
*   **Predictive Analytics**: Uses user stats to predict weak areas and potential failure points.
*   **Future Simulation**: Generates a "Future Exam" dated 3 months ahead, specifically targeting weaknesses.
*   **Immersive UI**: A sci-fi themed interface with countdown timers and "timeline divergence" reports based on performance.

### 💻 Code Sandbox
*   **Live Editor**: Browser-based code editing environment.
*   **AI Debugger**: Runs code analysis to fix bugs, explain logic, and simulate output.
*   **Visual Logic**: Automatically generates flowcharts corresponding to the code logic.

### 🎥 Media Generation
*   **Educational Videos**: Generates short explainer videos using **Veo** (`veo-3.1-fast-generate-preview`).
*   **Visual Storyboards**: Creates 4-panel comic strips using **Imagen** (`gemini-2.5-flash-image`) to explain concepts visually.

### 📊 Dashboard & Gamification
*   **Detailed Analytics**: Tracks Mastery Score, Streak, Questions Solved, and Predicted Exam Scores.
*   **Adaptive Study Plan**: Dynamically suggests daily tasks based on recent errors.
*   **Gamification**: XP system, Leveling, and Badge achievements.
*   **Teacher View**: Class-level analytics for educators to track attendance and topic struggles.

---

## 🛠️ Technology Stack

### Frontend
*   **Framework**: React 19
*   **Language**: TypeScript
*   **Styling**: Tailwind CSS (with Dark Mode support)
*   **Icons**: Lucide React
*   **Charts**: Recharts
*   **Diagrams**: Mermaid.js
*   **Markdown**: React Markdown

### AI & Models
*   **SDK**: `@google/genai`
*   **Text/Reasoning**: `gemini-2.5-flash`, `gemini-3-pro-preview`
*   **Image Generation**: `gemini-2.5-flash-image`
*   **Video Generation**: `veo-3.1-fast-generate-preview`
*   **Audio/Live**: `gemini-2.5-flash-native-audio-preview-09-2025`

---

## 🏗️ Architecture

### 1. Client-Side (Current Implementation)
The application currently runs as a robust Single Page Application (SPA).
*   **State Management**: React Hooks (`useState`, `useEffect`, `useRef`) and LocalStorage for persistence.
*   **Service Layer**: A dedicated `services/gemini.ts` module abstracts all AI API calls, handling prompt engineering, JSON schema validation, and error handling.

### 2. Backend Roadmap (Planned)
To scale to production, the following backend architecture is designed:

*   **Core API**: Node.js (NestJS) handling Auth, User Profiles, and Data Persistence.
*   **Database**: PostgreSQL for relational data (User progress, Courses) + Redis for caching.
*   **Storage**: Google Cloud Storage for hosting large PDFs and generated video assets.
*   **Background Workers**: BullMQ queues to handle long-running tasks like:
    *   PDF Parsing & OCR.
    *   Video Generation rendering.
    *   Deep mistake analysis.

---

## 🚦 Usage Guide

1.  **Dashboard**: Start here to see your daily progress and adaptive tasks.
2.  **Ask Question**: Go to Chat. Type a question or click "Voice Mode" for audio. Toggle "Deep Thinking" for complex math/physics problems.
3.  **Upload / PDF**: Upload a textbook chapter. Wait for the AI to generate the Plan, Notes, and Quiz.
4.  **Time Travel**: Click the clock icon in the sidebar. Simulate a future exam to test your readiness under pressure.
5.  **Coding Sandbox**: Paste a snippet of code. Click "Run & Debug" to get an explanation and flowchart.
6.  **Settings**: Toggle Dark/Light mode via the header icon.

---

## 📦 Installation

This project is built using standard web technologies.

1.  **Clone the repository**.
2.  **Install dependencies**:
    ```bash
    npm install
    ```
3.  **Environment Setup**:
    *   Create a `.env` file or set environment variables.
    *   `API_KEY`: Your Google Gemini API Key.
4.  **Run Development Server**:
    ```bash
    npm start
    ```
5.  **Build for Production**:
    ```bash
    npm run build
    ```

---

## 🔒 Permissions & Privacy
*   **Microphone**: Required for Voice Tutor mode.
*   **API Key**: The application requires a valid Google Cloud API key with access to Gemini models. In the demo version, users may be prompted to select their own key for paid features like Veo video generation.
