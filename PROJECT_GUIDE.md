# Trainlog — Project Guide

> **Purpose:** This document is the single source of truth for Trainlog's product vision, user experience, technical architecture, development principles, security requirements, and project scope.

> **Instructions for AI assistants:** Read this document in full before proposing architecture, modifying files, or generating code. If a request conflicts with a decision marked as **fixed**, **non-negotiable**, or **out of scope**, explain the conflict before proceeding.

## 1. Project Vision

Trainlog is a mobile-first, personal sports reflection journal designed for individual use.

After a workout, the user records a voice note describing their experience: how the session felt, what was enjoyable or challenging, their perceived energy or fatigue, their motivation, expectations, or any other relevant aspect of the experience.

The application:

1. Transcribes the voice recording.
2. Allows the user to review and edit the transcript.
3. Extracts structured insights from the confirmed reflection.
4. Provides a contextual response when it is useful.
5. Stores the entry only after explicit user confirmation.
6. Builds a personal history that can be explored through a calendar.
7. Identifies relevant patterns across previous entries.
8. Recommends articles, scientific reviews, studies, and educational resources based on the user's experiences, interests, activities, and recurring themes.

Trainlog is not designed to constantly tell users what they should do.

Its core identity is:

> **A personal sports reflection companion that helps users understand their experiences and learn from them over time.**

## 2. Product Principles

Trainlog is built around three connected pillars:

```text
🎙️ REFLECT

Talk naturally about your training experience.

        ↓

🧠 UNDERSTAND

Explore sensations, recurring themes,
and personal patterns.

        ↓

📚 LEARN

Discover relevant and evidence-aware
educational content.
```

### Reflect

The microphone is the central interaction.

Users can talk freely about:

* Physical sensations.
* Energy and fatigue.
* Motivation.
* Confidence.
* Frustration.
* Enjoyment.
* Performance expectations.
* Recovery.
* Sleep, when relevant.
* New activities or classes.
* Personal progress.
* Any other aspect of their sports experience.

The app should not force users to complete long forms or manually enter large amounts of data.

### Understand

Trainlog helps users:

* Summarize their experiences.
* Identify relevant themes.
* Reflect on what they expressed.
* Notice recurring patterns.
* Connect current experiences with previous entries.
* Explore useful questions.
* Consider an action only when it adds meaningful value.

### Learn

The Discover section recommends:

* Educational articles.
* Scientific reviews.
* Research studies.
* Institutional guidelines.
* Evidence-aware resources.

Recommendations are based on:

* Activities.
* Repeated sensations.
* Recurring themes.
* User interests.
* Questions and curiosities.
* Historical patterns.

## 3. Product Boundaries

The following rules are non-negotiable:

* Trainlog does not diagnose injuries, diseases, or psychological conditions.
* Trainlog does not provide therapy.
* Trainlog does not replace a sports psychologist, doctor, physiotherapist, coach, or other qualified professional.
* Trainlog does not prescribe treatments.
* Trainlog does not present correlations as proven causal relationships.
* Trainlog does not present AI interpretations as facts about the user.
* Trainlog does not store AI-generated information without explicit user confirmation.
* Trainlog may decide not to provide a recommendation when there is no meaningful reason to do so.

Trainlog may use reflection, self-awareness, and sports psychology-inspired principles, but it does not perform psychological assessment or mental health evaluation.

The application must clearly distinguish between:

### User-reported fact

Information directly expressed by the user.

> “The user reported sleeping for approximately six hours.”

### Observed pattern

A repeated or correlated signal found in the user's history.

> “Fatigue has appeared in three recent reflections.”

### Diagnosis

Not allowed.

> Incorrect: “You are experiencing overtraining.”

## 4. Minimum Intervention Principle

AI should not generate advice merely to appear useful.

A valid response can be:

> “Based on what you shared, the session appears to have been stable and satisfying. There is nothing that currently suggests a specific change or recommendation.”

The preferred order is:

1. Listen.
2. Reflect.
3. Help the user understand.
4. Recommend only when there is a clear reason.

## 5. Fixed Technology Stack

| Layer               | Technology                             |
| ------------------- | -------------------------------------- |
| Frontend            | React 19 + TypeScript                  |
| Build tool          | Vite                                   |
| Styling             | Tailwind CSS                           |
| UI components       | shadcn/ui                              |
| Routing             | React Router                           |
| Calendar            | React Day Picker                       |
| Forms               | React Hook Form                        |
| Validation          | Zod                                    |
| Audio recording     | MediaRecorder API                      |
| Authentication      | Firebase Authentication                |
| Database            | Cloud Firestore                        |
| Secure backend      | Firebase Cloud Functions               |
| Speech-to-text      | Groq Whisper                           |
| AI analysis         | Gemini Flash                           |
| Testing             | Vitest + React Testing Library + jsdom |
| Frontend deployment | Vercel                                 |

### Gemini model rule

Verify the currently supported Gemini model before hard-coding a model name. Gemini model availability and naming may change over time.

### API key rule

Groq and Gemini API keys:

* Must never be exposed in the frontend.
* Must never be committed to the repository.
* Must never be included in client-accessible environment variables.

All requests to these services must be handled through Firebase Cloud Functions.

## 6. Core User Flow

```text
User taps the microphone
        ↓
MediaRecorder captures audio
        ↓
An audio Blob is created
        ↓
A Firebase Cloud Function receives the audio
        ↓
Groq Whisper generates a transcript
        ↓
The transcript is displayed to the user
        ↓
The user edits or confirms it
        ↓
Gemini generates structured insights
        ↓
Zod validates the AI response
        ↓
The analysis is displayed to the user
        ↓
The user confirms it
        ↓
Firestore stores the entry
        ↓
Trainlog displays a contextual response,
or no recommendation when none is needed
```

No entry may be persisted before explicit user confirmation.

## 7. Scope Control

Trainlog has a real risk of overbuilding.

AI assistants must not add features, screens, data entities, integrations, or AI calls that were not explicitly requested in the current task.

Do not implement future roadmap items early because they appear easy to generate.

### Recommended implementation order

1. Project setup.
2. Authentication.
3. Core voice journal:

   * Record.
   * Transcribe.
   * Edit.
   * Analyze.
   * Confirm.
   * Save.
   * Display in the calendar.
   * Open the entry detail.
4. Use the application with real personal data.
5. Improve the experience based on actual usage.
6. Add contextual responses.
7. Add relevant recommendations.
8. Build Discover using a small curated seed collection.
9. Add historical pattern detection.
10. Add connections between current and previous entries.
11. Evaluate optional exercise content only after real-world use.

### Out of scope unless explicitly requested

* Wearable integrations.
* Apple Watch.
* Garmin.
* Fitbit.
* Calorie tracking.
* Nutrition tracking.
* Social features.
* Teams or roles.
* Payments.
* Subscriptions.
* Vector databases.
* Multi-agent systems.
* Real-time image generation.
* Full workout plans.
* Medical or psychological diagnosis.

## 8. Code Conventions

### Repository structure

```text
trainlog-ai/
├── src/
├── tests/
├── .gitignore
├── README.md
└── PROJECT_GUIDE.md
```

Use:

* Lowercase file and directory names.
* No spaces.
* Consistent organization.
* Clear ownership of responsibilities.

### Language

All code, identifiers, comments, commit messages, and technical documentation must be written in English.

### Naming

Use descriptive names.

Prefer:

```text
transcribeAudio
validateEntry
fetchRecentEntries
saveConfirmedEntry
```

Avoid vague names such as:

```text
data
thing
helper
utils
handleSomething
```

unless the context makes the purpose completely clear.

### Components and functions

* Keep components small.
* Give each component one clear responsibility.
* Keep functions focused.
* Extract reusable logic into hooks when appropriate.
* Prefer composition over large monolithic components.

### Complexity

* Prefer early returns.
* Apply fail-fast principles.
* Avoid unnecessary nesting.
* Avoid complex boolean flags.
* Avoid magic values.
* Use named constants for limits, durations, and thresholds.

### Design principles

* KISS: choose the simplest solution that satisfies the requirement.
* DRY: avoid unnecessary duplication without creating premature abstractions.
* SOLID principles adapted to React and TypeScript.
* Prefer clarity over cleverness.

## 9. Validation and Error Handling

Explicitly handle:

* Microphone permission denial.
* Unsupported browsers.
* Empty recordings.
* Network failures.
* Request timeouts.
* Transcription failures.
* Empty transcripts.
* Invalid Gemini responses.
* Firestore failures.
* Unauthenticated users.

User-facing errors must:

* Be clear.
* Explain what the user can do next.
* Avoid internal implementation details.
* Never expose stack traces, secrets, or service internals.

Internal logs must avoid unnecessary sensitive information.

## 10. Security

* Never trust user input.
* Validate forms at application boundaries.
* Validate AI responses with Zod.
* Validate data before persistence.
* Restrict Firestore access to authenticated users.
* Apply user-specific Firestore security rules.
* Follow the principle of least privilege.
* Prefer maintained and widely adopted libraries.

## 11. Testing

Use:

* Vitest.
* React Testing Library.
* jsdom.

The critical pipeline is:

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

Minimum test coverage:

### Success flow

* Record audio.
* Transcribe.
* Confirm the transcript.
* Analyze.
* Confirm the analysis.
* Save the entry.
* Display the entry in the calendar.

### Critical failures

* Empty transcript.
* Invalid AI response.
* Transcription failure.
* Firestore failure.
* Attempted write without user confirmation.

Exhaustive coverage is not required. Reliability in the critical flow is the priority.

## 12. Task Completion Checklist

Before considering a feature complete:

* [ ] The implementation matches the requested requirement.
* [ ] No unrequested features were added.
* [ ] At least one relevant error case is handled.
* [ ] The mobile experience was considered.
* [ ] Names are descriptive.
* [ ] Code is written in English.
* [ ] No unnecessary magic values are present.
* [ ] No secrets are exposed.
* [ ] AI responses are validated with Zod.
* [ ] Firestore does not write before user confirmation.
* [ ] Relevant tests pass.
* [ ] The implementation does not break the core flow.
* [ ] The solution remains simple and maintainable.

## 13. Instructions for AI Coding Assistants

Before implementing any task:

1. Read this document completely.
2. Identify the exact requirement.
3. Do not anticipate future features.
4. Do not expand the scope.
5. Explain architectural or security implications when relevant.
6. Verify current versions and availability of external APIs.
7. Keep changes small and testable.
8. Explain important technical decisions.
9. Run relevant tests.
10. Review the completion checklist.

If a request conflicts with the fixed stack, product boundaries, security rules, or explicit confirmation requirements, explain the conflict before generating code.
