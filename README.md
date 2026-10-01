# 🎬 ScriptCast Studio - Facecam Prompter & Vocal Coach

> A high-performance, **100% offline** facecam teleprompter, vocal coach, and video recorder for content creators making **YouTube Shorts, Instagram Reels, TikToks, and long-form videos**.

---

## ✨ Features

- **⚡️ 100% Offline & Client-Side Intelligence**:
  - Paste any script generated from ChatGPT, Claude, Gemini, DeepSeek, or written manually.
  - Automatically parses `[HOOK]`, `[PROBLEM]`, `[SOLUTION]`, `[CALL TO ACTION]` tags and stage cues like `(look directly into lens)`.
  - Automatically calculates target reading pace (WPM), word counts, and estimated duration per beat without needing external API keys or cloud processing.

- **🎙️ Real-time Audio VU Meter & Vocal Health**:
  - Real-time volume decibels and frequency visualization using the Web Audio API.
  - Live feedback on voice levels: *Noise Floor*, *Optimal Vocal Range (Green)*, *High Energy (Amber)*, and *Clipping / Too Close (Red)*.

- **⏱️ Live Director Cues ("When to Speak, When to Pause, When to Stop")**:
  - Pre-roll 3-2-1 countdown with synthesized audio beeps so you can focus on the camera lens.
  - Dynamic **"SPEAK NOW"** glowing prompt with word-level pace highlights matching target WPM.
  - **"PAUSE & HOLD"** cues during dramatic silences and breathing beats.
  - **"STOP / WRAP"** cues when the beat is completed.

- **🎛️ Dual Recording Modes**:
  1. **Beat-by-Beat Mode (Jump-cut / Shorts style)**:
     - Record line-by-line.
     - Stumbled on a line? Hit **Retake Beat** instantly without re-recording the rest!
     - 1-Click **Auto-Stitcher** smoothly joins all approved takes into a single unified master video.
  2. **Continuous Teleprompter Mode**:
     - Smooth continuous auto-scroll prompter with adjustable WPM speed slider and eye-line alignment line.

- **📐 Multi-Aspect Framing**:
  - **9:16 Vertical** (YouTube Shorts, Instagram Reels, TikTok)
  - **16:9 Widescreen** (YouTube, Desktop)
  - **1:1 Square** (Feed posts)
  - Mirror selfie view toggle

- **🎞️ Clean Studio Video Export**:
  - Exports a clean, pristine video + audio file (prompter text is **never burned** into your video).
  - WebM / MP4 video download + optional **Audio-Only** export for podcasts and voiceovers.

---

## 🚀 Quick Start

### Prerequisites
- Node.js (v18 or newer)
- npm or pnpm

### Installation
```bash
git clone https://github.com/Priyanshu-WebDev-io/script-reader-helper.git
cd script-reader-helper
npm install
```

### Running as a Native Desktop App (Electron)
```bash
npm run app
```
*Launches the studio as a standalone macOS/Windows desktop application with native hardware access, auto-granted media permissions, and direct file export.*

### Running in the Browser (Vite Dev Server)
```bash
npm run dev
```
*Open `http://localhost:5173` in any modern Chromium/WebKit browser (Chrome, Edge, Brave, Safari, Firefox).*

---

## ⌨️ Studio Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| <kbd>Space</kbd> | **Start / Stop Recording** |
| <kbd>→</kbd> | **Next Beat** |
| <kbd>←</kbd> | **Previous Beat** |
| <kbd>R</kbd> | **Retake Current Beat** |

---

## 🛠️ Technology Stack

- **Framework**: React 19 + Vite 8
- **Desktop Runtime**: Electron 44
- **Audio Processing**: Web Audio API (`AudioContext`, `AnalyserNode`, Synthesizer Cues)
- **Video Capture & Stitching**: HTML5 `MediaRecorder` API + Offscreen Canvas Stream Muxer
- **Icons**: Lucide React
- **Design System**: Cinematic Dark Glassmorphism with Vanilla CSS (Zero external CSS frameworks)

---

## 🔒 Privacy & Offline Guarantee

ScriptCast Studio operates entirely on your local machine. No video, audio, or script text is ever uploaded to any third-party server or external LLM API.
