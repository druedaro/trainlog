# Trainlog

> **Train. Reflect. Understand. Learn.**

Trainlog is a mobile-first sports reflection journal designed to help users better understand their training experiences through voice.

After a workout, users can record a voice note describing how the session went, how they felt, what they enjoyed, what they found challenging, or anything else relevant to their experience. The app transcribes the recording, extracts structured insights, provides contextual reflections when useful, and builds a personal history that can be explored through a calendar.

Trainlog also recommends relevant articles, scientific reviews, studies, and educational resources based on the user's experiences, recurring themes, interests, and activities.

The goal is not to constantly tell users how they should train. Trainlog is designed to support reflection, personal understanding, and learning.

## ✨ Key Features

* 🎙️ **Voice-first training journal**
  Record reflections naturally after a workout using the device microphone.

* 📝 **Editable transcription**
  Review and edit the generated transcript before it is analyzed or saved.

* 🧠 **Contextual AI reflections**
  Identify relevant physical, emotional, and sports-related themes without presenting AI interpretations as facts.

* 📅 **Calendar-based history**
  Browse previous training reflections and revisit experiences by date.

* 🔍 **Personal pattern detection**
  Explore recurring themes and connections across previous entries.

* 📚 **Personalized learning content**
  Discover articles, scientific reviews, studies, and educational resources related to the user's experiences and interests.

* 💡 **Relevant recommendations only**
  Trainlog can choose not to recommend anything when no action or additional guidance is needed.

* 🔒 **User-controlled data**
  AI-generated information is reviewed by the user before it is stored.

## 🧭 Product Principles

Trainlog is built around three core ideas:

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
* A voice-first mobile experience.
* A tool for understanding training experiences over time.
* A learning companion that connects experiences with relevant content.
* A portfolio project focused on modern frontend development, AI integration, and thoughtful product design.

### What Trainlog is not

* A medical application.
* A diagnostic tool.
* A replacement for a sports psychologist, doctor, physiotherapist, or coach.
* A workout generator.
* A calorie tracker.
* A wearable integration platform.
* A social fitness network.

Trainlog does not diagnose injuries, medical conditions, or psychological conditions. It does not prescribe treatments or present AI-generated interpretations as clinical conclusions.

## 🛠️ Tech Stack

### Frontend

* React 19
* TypeScript
* Vite
* Tailwind CSS
* shadcn/ui
* React Router
* React Day Picker
* React Hook Form
* Zod

### Audio and AI

* MediaRecorder API
* Groq Whisper for speech-to-text
* Gemini Flash for structured analysis and contextual responses

### Backend

* Firebase Authentication
* Cloud Firestore
* Firebase Cloud Functions

### Testing

* Vitest
* React Testing Library
* jsdom

### Deployment

* Vercel

## 🏗️ Main User Flow

```text
User records a voice note
          ↓
MediaRecorder captures the audio
          ↓
A Firebase Cloud Function receives the audio
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
          ↓
Relevant educational resources may be added to Discover
```

No entry is stored before the user explicitly confirms it.

## 📱 Mobile-First Experience

Trainlog is designed primarily for daily use on a smartphone.

The microphone is the main interaction and is intended to be quick and easy to access after a workout. The interface prioritizes:

* Large touch targets.
* Clear visual hierarchy.
* Minimal friction.
* Readable content.
* Calm and focused interactions.
* Fast access to the recording flow.

## 🗺️ Roadmap

### Phase 1 — Project Foundation

* [ ] Initialize React, TypeScript, and Vite.
* [ ] Configure Tailwind CSS.
* [ ] Configure shadcn/ui.
* [ ] Configure routing.
* [ ] Configure testing.
* [ ] Define the initial project structure.

### Phase 2 — Authentication

* [ ] User registration.
* [ ] User login.
* [ ] User logout.
* [ ] Protected routes.

### Phase 3 — Core Voice Journal

* [ ] Record audio with MediaRecorder.
* [ ] Upload audio securely.
* [ ] Transcribe audio with Groq Whisper.
* [ ] Review and edit transcripts.
* [ ] Analyze confirmed transcripts with Gemini.
* [ ] Validate AI responses with Zod.
* [ ] Review and confirm generated insights.
* [ ] Store confirmed entries in Firestore.

### Phase 4 — Calendar History

* [ ] Display recorded entries in a calendar.
* [ ] Open an entry by selecting a date.
* [ ] Display the original reflection and structured insights.

### Phase 5 — Contextual Support

* [ ] Add contextual responses.
* [ ] Add recommendations only when relevant.
* [ ] Support recovery, preparation, and reflection-related suggestions.

### Phase 6 — Discover

* [ ] Add a small curated resource collection.
* [ ] Recommend resources based on activities and recurring themes.
* [ ] Display why each resource was recommended.
* [ ] Allow users to save or dismiss resources.

### Phase 7 — Personal Patterns

* [ ] Analyze structured historical data.
* [ ] Identify recurring themes.
* [ ] Connect current reflections with previous experiences.

## 🚀 Getting Started

### Prerequisites

Make sure you have the following installed:

* Node.js
* npm

### Installation

Clone the repository:

```bash
git clone https://github.com/druedaro/trainlog-ai.git
```

Move into the project directory:

```bash
cd trainlog-ai
```

Install dependencies:

```bash
npm install
```

Create a local environment file:

```bash
cp .env.example .env
```

Add the required public Firebase configuration values to `.env`.

> Private API keys for Groq and Gemini must never be exposed in the frontend. They are configured securely in Firebase Cloud Functions.

Start the development server:

```bash
npm run dev
```

## 🧪 Testing

Run the test suite:

```bash
npm run test
```

Run tests once:

```bash
npm run test:run
```

## 🏗️ Production Build

Create a production build:

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

## 🔐 Security and Privacy

Trainlog follows these principles:

* API keys are never exposed in the frontend.
* Groq and Gemini requests are handled through Firebase Cloud Functions.
* User input is validated at application boundaries.
* AI responses are validated with Zod before being used or persisted.
* Firestore access is restricted to authenticated users.
* Users review AI-generated information before it is stored.
* AI-generated interpretations are kept separate from the user's original words.
* Historical pattern analysis uses structured data rather than full transcripts whenever possible.

## 🧪 Testing Strategy

The most important flow is:

```text
Audio
  ↓
Transcription
  ↓
AI analysis
  ↓
User confirmation
  ↓
Firestore
```

Tests cover:

* The main success flow.
* Empty transcripts.
* Invalid AI responses.
* Failed transcription requests.
* Firestore write failures.
* Attempts to save entries without confirmation.

The goal is not exhaustive coverage. The priority is ensuring that the most important user flow is reliable.

## 📁 Project Documentation

The complete product, architecture, development, security, and scope guidelines are available in:

```text
PROJECT_GUIDE.md
```

This document should be read before making architectural decisions or implementing new features.

## 📸 Screenshots

Screenshots and product mockups will be added during development.

## 🌐 Live Demo

The live application will be deployed on Vercel.

> Coming soon.

## 👤 Author

**David Rueda**

Frontend Developer focused on React, TypeScript, accessible interfaces, and modern web experiences.

* Portfolio: [David Rueda Portfolio](https://davidrueda.vercel.app/)
* GitHub: [David Rueda on GitHub](https://github.com/druedaro)

## 📄 License

This project is intended as a personal project and portfolio piece.

License information will be added before the first public release.
