# 🎯 MockAI PRO — AI-Powered Mock Interview System

> **Enterprise-grade, zero-human-interaction AI mock interview platform** with real-time face proctoring, voice interaction, adaptive questioning, and a 4-strike anti-cheating engine.

![Platform](https://img.shields.io/badge/Platform-Web-blue?style=flat-square)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)
![Status](https://img.shields.io/badge/Status-Production_Ready-brightgreen?style=flat-square)
![Security](https://img.shields.io/badge/Security-4_Strike_System-red?style=flat-square)

---

## 📋 Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Application Workflow](#application-workflow)
- [Security & Anti-Cheating](#security--anti-cheating)
- [Face Detection & Proctoring](#face-detection--proctoring)
- [Interview Domains](#interview-domains)
- [Screenshots](#screenshots)
- [Browser Compatibility](#browser-compatibility)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

**MockAI PRO** is a fully autonomous, client-side AI mock interview platform designed to simulate real placement interviews. No human interviewer is needed — the AI conducts technical, HR, and behavioral interviews with voice interaction, real-time evaluation, strict anti-cheating measures, and detailed performance analytics.

Built for students and professionals preparing for placement interviews at companies like **Google, Amazon, Microsoft, TCS, and Infosys**.

---

## Key Features

### 🤖 AI Interviewer
- Dynamic question flow with adaptive difficulty
- Follow-up questions based on candidate responses
- AI voice interaction via Web Speech API (text-to-speech)
- Support for **DSA, DBMS, OS, Web Dev, HR, System Design** domains
- Company-specific templates (Google, Amazon, Microsoft, TCS)

### 🛡️ 4-Strike Security Engine
- **Strike 1-3**: Warning toast + AI voice alert
- **Strike 4**: Immediate exam termination & disqualification
- Triggers: Tab switching, screenshots, face absence, gaze deviation, fullscreen exit, DevTools

### 👁️ Real-Time Face Proctoring
- Live webcam feed in Picture-in-Picture (PiP) corner
- Skin-tone pixel analysis for universal face detection
- Gaze tracking with look-away detection
- Emotion analysis (confidence, nervousness, engagement, stress)
- "No Face = No Exam" blocker overlay

### 🎤 Voice Input & Output
- Speech-to-text for hands-free answering
- AI speaks questions aloud with natural voice
- Typing fallback available

### 📊 Post-Interview Analytics
- Overall score with letter grade (A+ to F)
- Question-by-question breakdown with ideal answers
- Strengths & weaknesses identification
- Communication score & time management analysis
- Downloadable PDF report
- Skill radar chart visualization

### 🔒 Hardware Lifecycle Management
- Camera activates only during interview
- Instant hardware shutdown on End Session
- No ghost streams after exam completion

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | HTML5, CSS3, Vanilla JavaScript (ES6+) |
| **Styling** | Custom CSS Design System (dark theme, glassmorphism) |
| **Voice** | Web Speech API (SpeechRecognition + SpeechSynthesis) |
| **Camera** | MediaDevices API (getUserMedia) |
| **Face Detection** | Canvas pixel analysis + FaceDetector API (Chromium) |
| **Storage** | LocalStorage / SessionStorage |
| **Server** | Any static file server (e.g., `npx serve`) |

> **Zero dependencies.** No npm packages, no frameworks, no build step required.

---

## Project Structure

```
AI-Mock-Interview/
├── index.html                 # Main SPA — all screens
├── README.md                  # This file
├── css/
│   ├── main.css               # Global design system & variables
│   ├── components.css         # Reusable UI components
│   ├── animations.css         # Micro-animations & transitions
│   ├── dashboard.css          # Dashboard layout & stats
│   └── interview.css          # Interview screen & webcam PiP
└── js/
    ├── app.js                 # Main controller — navigation, state, lifecycle
    ├── security.js            # 4-strike anti-cheating engine
    ├── face-detection.js      # Camera, face tracking, emotion analysis
    ├── verification.js        # Pre-interview hardware checks
    ├── interview-engine.js    # Question flow, timer, scoring
    ├── question-bank.js       # 200+ questions across all domains
    ├── evaluator.js           # Answer evaluation & scoring
    ├── speech.js              # Voice input/output (Web Speech API)
    ├── storage.js             # LocalStorage persistence layer
    ├── ui-components.js       # Toast, modal, alerts, charts
    ├── analytics.js           # Charts & performance visualization
    ├── pdf-report.js          # Downloadable PDF report generator
    └── code-editor.js         # Code input support
```

---

## Getting Started

### Prerequisites
- A modern web browser (Chrome/Edge recommended)
- Webcam and microphone

### Installation & Run

```bash
# Clone the repository
git clone https://github.com/your-username/AI-Mock-Interview.git

# Navigate to project
cd AI-Mock-Interview

# Serve with any static server
npx -y serve -p 3000 .

# Open in browser
# http://localhost:3000
```

### Quick Start (No Install)
Simply open `index.html` directly in Chrome/Edge — the app works without a server for basic functionality.

### Default Login
| Field | Value |
|-------|-------|
| Email | `candidate@mockai.com` |
| Password | `password123` |

> Authentication is mock/client-side for demonstration purposes.

---

## Application Workflow

```
Login → Dashboard → Setup (3 steps) → System Verification → Interview → Results
```

### Step-by-Step Flow

1. **Login** — Enter credentials on the "Welcome Back" screen
2. **Dashboard** — View stats, streaks, and quick-start domain cards
3. **Setup** — Select domain → difficulty → duration (3-step wizard)
4. **Verification** — Automated hardware checks:
   - ✅ Camera access
   - ✅ Microphone access
   - ✅ Face detection
   - ✅ Fullscreen mode
5. **Interview** — AI asks questions, candidate answers via voice/text
6. **Results** — Grade, score breakdown, strengths, PDF report

---

## Security & Anti-Cheating

### 4-Strike System

| Strike | What Happens |
|--------|-------------|
| **1st** | ⚠️ Warning toast notification + AI voice alert |
| **2nd** | ⚠️ Warning toast notification + AI voice alert |
| **3rd** | ⚠️ Warning toast notification + AI voice alert |
| **4th** | 🚫 **EXAM TERMINATED** — Candidate disqualified |

### Monitored Violations

| Violation | Detection Method |
|-----------|-----------------|
| **Tab Switching** | `visibilitychange` event |
| **Screenshots** | `PrintScreen`, `Cmd+Shift+S` key blocking |
| **Fullscreen Exit** | `fullscreenchange` event |
| **Window Blur** | `blur` event on window |
| **Copy/Paste** | `copy`, `cut`, `paste` event blocking |
| **Right Click** | `contextmenu` event blocking |
| **DevTools** | Window dimension monitoring |
| **Face Absent** | Real-time canvas skin detection |
| **Looking Away** | Gaze offset calculation |
| **Idle** | 2-min warning, 5-min termination |

---

## Face Detection & Proctoring

### How It Works
1. **Verification Phase** — Canvas-based skin-tone pixel analysis confirms face presence
2. **Interview Phase** — Continuous detection loop (400ms intervals):
   - Face bounding box with dashed green/red overlay
   - Eye region tracking
   - Gaze direction indicator
   - Emotion label (focused, nervous, confident, anxious)
   - Nervousness bar visualization

### Emotion Metrics Tracked
- **Confidence** — Inverse of nervousness + gaze stability
- **Nervousness** — Head movement frequency + gaze instability
- **Engagement** — Face presence + screen focus
- **Stress** — Combined nervousness + gaze variance
- **Gaze Stability** — Variance of gaze offset over time
- **Blink Rate** — Estimated from motion spikes

---

## Interview Domains

| Domain | Topics Covered |
|--------|---------------|
| **DSA** | Arrays, Trees, Graphs, Dynamic Programming, Sorting |
| **DBMS** | SQL, Normalization, Transactions, Indexing |
| **OS** | Process Management, Memory, Scheduling, Deadlocks |
| **Web Dev** | HTML, CSS, JavaScript, React, Node.js |
| **HR** | Tell me about yourself, Strengths, Weaknesses, Career goals |
| **System Design** | Scalability, Load Balancing, Database Design |

### Company Templates
- **Google** — Hard DSA & System Design
- **Amazon** — Leadership Principles & DSA
- **Microsoft** — Core Tech & Problem Solving
- **TCS Ninja** — Aptitude & Core Concepts

---

## Browser Compatibility

| Browser | Support | Notes |
|---------|---------|-------|
| **Chrome 90+** | ✅ Full | Recommended — native FaceDetector API |
| **Edge 90+** | ✅ Full | Chromium-based, full support |
| **Firefox** | ⚠️ Partial | No native FaceDetector, uses fallback |
| **Safari** | ⚠️ Partial | Limited WebRTC support |

> **Recommended**: Use Google Chrome or Microsoft Edge for the best experience.

---

## Configuration

### Interview Settings (in-app)
- **Voice Enabled** — Toggle AI voice on/off
- **Webcam Enabled** — Toggle camera proctoring
- **Fullscreen Mode** — Enforce fullscreen during interview
- **AI Voice Rate** — Adjust speaking speed
- **AI Voice Pitch** — Adjust voice pitch

### Security Thresholds (in `face-detection.js`)
```javascript
NO_FACE_WARN = 2000    // 2s before face-absent warning
NO_FACE_VIOL = 5000    // 5s before critical violation
LOOK_AWAY_WARN = 3000  // 3s before look-away strike
DETECT_MS = 400        // Detection loop interval
```

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/new-domain`)
3. Commit changes (`git commit -m 'Add Python interview domain'`)
4. Push to branch (`git push origin feature/new-domain`)
5. Open a Pull Request

---

## License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

## Acknowledgments

- **Web Speech API** — Browser-native voice recognition & synthesis
- **MediaDevices API** — Camera & microphone access
- **FaceDetector API** — Chromium experimental face detection
- **Canvas API** — Fallback skin-tone analysis for cross-browser support

---

<div align="center">

**Built with ❤️ for Placement Success**

*MockAI PRO — Your AI Interview Coach*

</div>
