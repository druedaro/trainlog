# Trainlog

> **Train. Reflect. Understand. Learn.**

Trainlog is a voice-first sports reflection journal designed to help users better understand their training experiences through natural speech.

After a workout, users record a voice note describing how the session went — what they felt, what they enjoyed, what challenged them. The app transcribes the recording, extracts structured insights using AI, provides contextual reflections, and builds a personal history that can be explored through a calendar, weekly summaries, and a personal AI coach.
<div align="center">
  <img width="250" alt="2-mobile-trainlog" src="https://github.com/user-attachments/assets/6982d62f-d1ab-4215-81b1-ed5285b524a2" />
</div>


## 🌐 Live Demo

**[trainlog-journal.vercel.app](https://trainlog-journal.vercel.app/)**

## ✨ Key Features

* 🎙️ **Voice-first training journal**
  Record reflections naturally after a workout using the device microphone.

* 📝 **Editable transcription**
  Review and edit the generated transcript before it is analyzed or saved.

* 🧠 **Contextual AI reflections**
  Identify relevant physical, emotional, and sports-related themes without presenting AI interpretations as facts.

* 📅 **Calendar-based history**
  Browse previous training reflections and revisit experiences by date.

* 🔍 **Weekly insights & pattern detection**
  Explore energy levels, mood trends, recurring themes, and AI-generated weekly summaries across your entries.
<div align="center">
  <img width="650" alt="1-tablet-trainlog" src="https://github.com/user-attachments/assets/f1caf783-dd72-4035-a17e-34733850bd07" />
</div>

* 📚 **Personalized learning content (Discover)**
  Browse curated articles by category (Training, Nutrition, Mindset, Recovery) or get AI-generated recommendations based on your journal entries.

* 🤖 **AI Coach (Anna)**
  A persistent chat interface with your personal AI sports coach. Anna has full context of your entire journal, responds to voice dictation, reads her responses aloud via Text-to-Speech, and provides evidence-based guidance.

* 🔖 **Save & revisit content**
  Bookmark articles from Discover to build your personal knowledge library with native-like infinite scrolling pagination.

* 🚀 **Personalized Onboarding**
  A customized initial setup flow to capture user preferences, gender, and notification settings for a tailored experience.

* 📊 **Automated Monthly Reports**
  AI-generated comprehensive summaries of the past month's training, highlighting progress, themes, and actionable advice.

* 🔔 **Push Notifications**
  Stay engaged with background updates and alerts via Firebase Cloud Messaging.

* 🏆 **Gamification & Milestones**
  A robust achievement system designed to reward consistency without creating anxiety. Earn badges for emotional resilience, consistency, and exploration.

* 🛡️ **Hardened Security & Validation**
  Strict Zod schema validations across the frontend and backend boundaries, with real-time XSS protection and intelligent character limits.

* 💡 **Context-Aware Interactions**
  Empathic, micro-interactions generated dynamically based on your perceived mood at the end of each session.

* 🔒 **User-controlled data**
  AI-generated information is reviewed by the user before it is stored. Account deletion removes all data.

* 📱 **Installable PWA**
  Trainlog can be installed as a Progressive Web App (PWA) on iOS, Android, and Desktop, behaving like a native application with an immersive full-screen experience and high-resolution icons.



## 🧭 Product Principles

```text
🎙️ REFLECT
Talk naturally about your training experience.

        ↓

🧠 UNDERSTAND
Explore sensations, recurring themes, and personal patterns.

        ↓

📚 LEARN
Discover relevant and evidence-aware educational content.
```

### What Trainlog is

* A personal sports reflection journal.
* A voice-first experience optimized for mobile, tablet, and desktop.
* A tool for understanding training experiences over time.
* A learning companion that connects experiences with relevant content.

### What Trainlog is not

* A medical application.
* A diagnostic tool.
* A replacement for a sports psychologist, doctor, physiotherapist, or coach.
* A workout generator, calorie tracker, or wearable integration platform.

Trainlog does not diagnose injuries, medical conditions, or psychological conditions. It does not prescribe treatments or present AI-generated interpretations as clinical conclusions.

## 🛠️ Tech Stack

### Frontend

* React 19 + TypeScript
* Vite
* Tailwind CSS + shadcn/ui
* React Router v7
* TanStack Query (React Query)
* React Day Picker
* React Markdown

### Audio & AI

* MediaRecorder API (browser-native)
* Groq Whisper — speech-to-text
* Google Gemini Flash — structured analysis, contextual responses, article generation, AI coaching

### Backend

* Firebase Authentication (Google OAuth)
* Cloud Firestore (per-user data isolation)
* Vercel Serverless Functions (API layer)

### Testing

* Vitest + React Testing Library + jsdom

### Deployment

* Vercel (frontend + serverless API)

## 📱 Responsive Design

Trainlog is designed for daily use across all screen sizes:

| Screen | Navigation | Layout |
|--------|-----------|--------|
| **Mobile** (< 768px) | Bottom navigation bar | Single column, full-width |
| **Tablet** (768px–1024px) | Side navigation rail | Bento-box grids, expanded calendars |
| **Desktop** (> 1024px) | Side navigation rail | Centered content with comfortable reading widths |

## 🏗️ Main User Flow

```text
User records a voice note
          ↓
MediaRecorder captures the audio
          ↓
Vercel serverless function receives the audio
          ↓
Groq Whisper generates a transcript
          ↓
The user reviews and edits the transcript
          ↓
The user confirms the content
          ↓
Gemini generates structured insights
          ↓
Zod validates the AI response
          ↓
The user reviews and confirms the analysis
          ↓
Firestore stores the entry
          ↓
Trainlog displays a contextual response
```

No entry is stored before the user explicitly confirms it.

## 🧪 Testing

Trainlog implements a BDD-style testing suite using Vitest and React Testing Library:

```bash
# Run tests once
npm run test

# Run tests in watch mode
npm run test:watch
```

**41 tests across 22 test files** covering:
- Authentication flows and route guards
- Journal recording, transcription, and analysis flows
- Calendar navigation and entry detail views
- Discover page article rendering and interaction
- AI Coach chat interface
- Insights and profile pages
- Layout and navigation components

## 🗺️ Roadmap

### Phase 1 — Project Foundation ✅
### Phase 2 — Authentication ✅
### Phase 3 — Core Voice Journal ✅
### Phase 4 — Calendar History ✅
### Phase 5 — Contextual Support ✅
### Phase 6 — Discover ✅
### Phase 7 — Personal Patterns & Weekly Insights ✅
### Phase 8 — AI Coach (Anna) ✅
### Phase 9 — Push Notifications, Monthly Reports & PWA ✅
### Phase 10 — Security Hardening, Gamification & UX Polish ✅
### Phase 11 — Tablet & Desktop Adaptation ✅
### Phase 12 — Release Preparation ✅

## 🚀 Getting Started

### Prerequisites

* Node.js (v18+)
* npm

### Installation

```bash
git clone https://github.com/druedaro/trainlog.git
cd trainlog
npm install
```

Create a local environment file:

```bash
cp .env.example .env
```

Add the required configuration values to `.env`:
- `GROQ_API_KEY` — Groq API key for Whisper transcription (server-side)
- `GOOGLE_GENAI_API_KEY` — Google Gemini API key (server-side)
- `FIREBASE_SERVICE_ACCOUNT` — Firebase Admin SDK service account, base64 encoded (server-side)
- `UPSTASH_REDIS_REST_URL` — Upstash Redis endpoint for Rate Limiting (server-side)
- `UPSTASH_REDIS_REST_TOKEN` — Upstash Redis token (server-side)

> Firebase client configuration (public keys) is set in `src/lib/firebase.ts`.

Start the development server:

```bash
npm run dev
```

## 🏗️ Production Build

```bash
npm run build
npm run preview
```

## 🔐 Security & Privacy

* **Rate Limiting:** All AI and resource-intensive endpoints are protected against abuse using sliding window rate limits via Upstash Redis.
* **PII Sanitization:** User inputs (voice transcripts and chat messages) are actively scrubbed in real-time to censor emails, phone numbers, and DNI/NIEs before being sent to third-party LLMs.
* **Prompt Injection Defense:** Strict delimiters and "ignore" directives shield the system prompts from being hijacked or manipulated by malicious user inputs.
* API keys are never exposed in the frontend.
* Groq and Gemini requests are handled through Vercel serverless functions.
* Firebase Auth tokens are verified server-side before processing any request.
* User input is validated at application boundaries.
* AI responses are validated with Zod before being used or persisted.
* Firestore security rules enforce per-user data isolation.
* Users review AI-generated information before it is stored.
* Voice recordings are processed for transcription and never stored as audio files.
* Users can delete their account and all associated data from the profile page.

## 👤 Author

**David Rueda**

Frontend Developer focused on React, TypeScript, accessible interfaces, and modern web experiences.

* Portfolio: [davidrueda.vercel.app](https://davidrueda.vercel.app/)
* GitHub: [github.com/druedaro](https://github.com/druedaro)

## 📄 License

This project is licensed under the [MIT License](LICENSE).
