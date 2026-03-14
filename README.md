# 🤖 AI Phone Agent

A real-time AI-powered phone call simulator built with **Next.js**, **Mastra**, and **OpenAI's Realtime API**. Users can have natural voice conversations with an AI customer service agent that collects information and assesses urgency.

![Built with Next.js](https://img.shields.io/badge/Next.js-15-black)
![OpenAI Realtime](https://img.shields.io/badge/OpenAI-Realtime_API-green)
![Mastra](https://img.shields.io/badge/Mastra-AI_Agent-purple)

## ✨ Features

- **🎤 Real-time Voice Conversation** — Talk naturally with the AI agent via WebRTC
- **📞 Phone Call Simulation** — Rings twice, agent picks up, full call experience
- **🧠 Smart Information Extraction** — Agent naturally collects phone number, email, and issue
- **🔥 Urgency Scoring** — AI determines and scores urgency (1-10) with reasoning
- **📊 Live Dashboard** — View all calls with summaries, urgency gauges, and transcripts
- **✨ Beautiful Animations** — Framer Motion powered UI with glass-morphism design

## 🏗️ Tech Stack

| Technology | Purpose |
|-----------|---------|
| **Next.js 15** | Full-stack React framework |
| **Mastra** | AI agent configuration |
| **OpenAI Realtime API** | WebRTC voice conversation with GPT-4o |
| **SQLite** | Call data persistence |
| **Framer Motion** | Animations & transitions |
| **Tailwind CSS** | Styling |

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- OpenAI API key with access to `gpt-4o-realtime-preview`
- A microphone

### Setup

1. **Clone and install**
   ```bash
   cd ai-phone-agent
   npm install
   ```

2. **Set your OpenAI API key**
   ```bash
   # Edit .env.local and add your key
   OPENAI_API_KEY=sk-your-key-here
   ```

3. **Run the dev server**
   ```bash
   npm run dev
   ```

4. **Open in browser**
   ```
   http://localhost:3000
   ```

## 📱 How It Works

### Call Flow
```
User clicks "Generate Call"
       ↓
Phone rings twice (ring animation)
       ↓
AI Agent picks up & greets user
       ↓
User speaks → Browser mic captures audio
       ↓
Audio streams via WebRTC to OpenAI Realtime API
       ↓
GPT-4o processes & responds in real-time
       ↓
AI voice streams back to browser
       ↓
Agent collects: phone, email, issue
       ↓
Agent scores urgency (1-10)
       ↓
Call ends → Data saved to SQLite
       ↓
Dashboard shows summary & urgency score
```

### Architecture
```
Browser ←→ WebRTC ←→ OpenAI Realtime API (GPT-4o)
   ↕                         ↕
Next.js API Routes    Function Calling (save_call_data)
   ↕
SQLite Database
   ↕
Dashboard (real-time updates)
```

## 📊 Dashboard

The dashboard (`/dashboard`) shows:
- **Stats Overview** — Total calls, completed, average urgency, high urgency count
- **Urgency Distribution** — Visual bar chart of urgency scores
- **Call Cards** — Expandable cards with:
  - Urgency gauge (color-coded circular progress)
  - Contact info (phone, email)
  - Issue description
  - Full call summary
  - Complete transcript

## 🎨 UI Features

- **Dark theme** with gradient mesh background
- **Glass-morphism** cards with frosted glass effect
- **Animated waveforms** during conversation
- **Pulse animations** during ringing
- **Staggered card entrance** on dashboard
- **Smooth state transitions** between call phases

## 📁 Project Structure

```
src/
├── app/
│   ├── page.tsx                    # Call screen
│   ├── dashboard/page.tsx          # Dashboard
│   ├── api/
│   │   ├── session/route.ts        # OpenAI ephemeral token
│   │   └── calls/route.ts          # Call CRUD operations
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── CallScreen.tsx              # Main call orchestrator
│   ├── PhoneRinging.tsx            # Ring animation
│   ├── ActiveCall.tsx              # Active call UI
│   ├── WaveformVisualizer.tsx      # Audio waveform bars
│   ├── LiveTranscript.tsx          # Real-time transcript
│   ├── CallSummary.tsx             # Post-call summary
│   ├── CallCard.tsx                # Dashboard call card
│   └── UrgencyGauge.tsx            # Circular urgency meter
├── hooks/
│   └── useWebRTCSession.ts         # WebRTC + Realtime API hook
└── lib/
    ├── agent-config.ts             # Agent prompt + tool definitions
    └── db.ts                       # SQLite operations
```

## 🔑 Environment Variables

| Variable | Description |
|----------|-------------|
| `OPENAI_API_KEY` | Your OpenAI API key (needs Realtime API access) |

## License

MIT
