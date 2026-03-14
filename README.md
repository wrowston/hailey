# Hailey — AI Voice Agent for Mr Wrench Plumbing & HVAC

Hailey is a real-time AI voice agent that handles customer intake and appointment scheduling for a plumbing and HVAC service company. Customers call in, speak naturally with Hailey, and walk away with a confirmed appointment — no hold music, no phone trees.

Built with **Next.js**, **Mastra**, **xAI Realtime Voice**, and **Convex**.

![Next.js 16](https://img.shields.io/badge/Next.js-16-black)
![xAI Realtime](https://img.shields.io/badge/xAI-Realtime_Voice-blue)
![Mastra](https://img.shields.io/badge/Mastra-AI_Agents-purple)
![Convex](https://img.shields.io/badge/Convex-Database-red)

## What It Does

- **Voice intake** — Hailey greets the caller, identifies the issue, collects contact info, and verifies the service area (50-mile radius from Lehi, UT)
- **Returning customer recognition** — Looks up existing customers by phone number to skip redundant questions
- **Urgency scoring** — Rates the issue 1–10 (burst pipe = 10, routine checkup = 2) and triages accordingly
- **Appointment scheduling** — Finds available technician slots, matches by skill, and books the appointment
- **Emergency bumping** — For high-urgency calls, can reschedule routine maintenance to free up a technician
- **Confirmation emails** — Sends appointment details via Resend after booking
- **Dashboard** — Staff view of all service requests, urgency scores, and a calendar of scheduled services

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Browser                                                    │
│  ┌──────────┐   ┌───────────┐   ┌────────────────────────┐ │
│  │CallScreen│──▶│useVoice   │──▶│ WebSocket (wss://      │ │
│  │          │   │Session    │   │ api.x.ai/v1/realtime)  │ │
│  └──────────┘   └───────────┘   └──────────┬─────────────┘ │
│       │              │                      │               │
│       │         Mic PCM ↕ Speaker PCM       │               │
│       │                                     │               │
│       ▼                                     ▼               │
│  ┌──────────┐                     xAI Voice Agent (Hailey)  │
│  │Dashboard │                     Tools:                    │
│  │Calendar  │                       • check_availability    │
│  └──────────┘                       • confirm_booking       │
└───────┬─────────────────────────────────────┬───────────────┘
        │                                     │
        ▼                                     ▼
┌───────────────────────┐      ┌──────────────────────────────┐
│  Next.js API Routes   │      │  /api/schedule               │
│  /api/calls           │      │  Runs Mastra Workflow:        │
│  /api/session         │      │  1. Save intake               │
│  /api/customer-lookup │      │  2. Find availability         │
│  /api/scheduled-      │      │  3. Await confirmation        │
│      services         │      │  4. Book appointment          │
└───────┬───────────────┘      │  5. Send confirmation email   │
        │                      └──────────┬───────────────────┘
        │                                 │
        ▼                                 ▼
┌─────────────────────────────────────────────────────────────┐
│  Convex                                                     │
│  customers · technicians · serviceRequests · jobs           │
│  scheduledServices · agentDecisions · outgoingMessages      │
└─────────────────────────────────────────────────────────────┘
```

### Voice Layer

The browser connects to **xAI's Realtime API** over WebSocket. Audio flows as 24 kHz PCM — mic input is captured via `ScriptProcessorNode`, encoded to base64, and streamed to xAI. The agent's audio response streams back the same way. The voice agent has two callable tools (`check_availability` and `confirm_booking`) that hit the Next.js API to trigger the Mastra workflow.

### Agent Layer (Mastra)

Two agents handle the backend logic, both powered by Claude Sonnet:

| Agent | Role |
|-------|------|
| **Intake Agent** | Processes customer info, checks service area via geocoding, scores urgency, saves the service request |
| **Scheduling Agent** | Finds available slots across technicians (skill-matched), books appointments, handles emergency bumping of routine jobs |

### Workflow

The **intake-scheduling workflow** orchestrates the full flow as a linear pipeline:

1. **Save intake** — Create/update customer, create service request in Convex
2. **Find availability** — Query technician schedules, return 2-hour slots (with after-hours on-call for emergencies)
3. **Await confirmation** — Suspend the workflow until the customer picks a slot (auto-selects for emergencies)
4. **Book appointment** — Create the job, assign the technician, update the service request
5. **Send confirmation** — Email the customer via Resend with appointment details

### Data Layer (Convex)

| Table | Purpose |
|-------|---------|
| `customers` | Contact info, VIP status, maintenance membership, equipment history |
| `technicians` | Skills, territory, availability status, on-call flag, reliability score |
| `serviceRequests` | Issue summary, urgency score, job type, lifecycle status |
| `jobs` | Technician assignment, schedule, priority, bump tracking |
| `scheduledServices` | Denormalized view for calendar display |
| `agentDecisions` | Audit log of triage, assignment, and bump decisions |
| `outgoingMessages` | Record of all sent emails and notifications |

## Tech Stack

| Technology | Purpose |
|-----------|---------|
| **Next.js 16** | Full-stack React framework |
| **Mastra** | AI agent orchestration, workflows, memory, and observability |
| **xAI Realtime API** | WebSocket voice conversation |
| **Claude Sonnet** | LLM for intake and scheduling agents |
| **Convex** | Real-time database and backend functions |
| **Resend** | Transactional email delivery |
| **Framer Motion** | Animations and transitions |
| **Tailwind CSS 4** | Styling |
| **Zod** | Schema validation |

## Quick Start

### Prerequisites

- Node.js 18+
- API keys for xAI, Anthropic, Convex, and Resend
- A microphone

### Setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Configure environment variables**

   Create `.env.local` with the following:

   ```env
   XAI_API_KEY=
   ANTHROPIC_API_KEY=
   CONVEX_DEPLOYMENT=
   NEXT_PUBLIC_CONVEX_URL=
   NEXT_PUBLIC_CONVEX_SITE_URL=
   CONVEX_ADMIN_KEY=
   RESEND_API_KEY=
   ```

3. **Run the dev server**

   ```bash
   npm run dev
   ```

4. **Open in browser**

   ```
   http://localhost:3000
   ```

## Call Flow

```
User enters phone (optional) → clicks "Generate Call"
  ↓
Phone rings → WebSocket connects to xAI
  ↓
Hailey greets caller (returning customers get personalized greeting)
  ↓
Voice conversation: issue discovery → contact collection → address verification
  ↓
check_availability tool fires → Mastra workflow starts
  ↓
Workflow saves intake to Convex, finds technician slots
  ↓
Hailey presents available times to caller
  ↓
Caller picks a slot → confirm_booking tool fires → workflow resumes
  ↓
Job booked in Convex → confirmation email sent via Resend
  ↓
Call ends → summary displayed with urgency score and booking details
```

## Project Structure

```
src/
├── app/
│   ├── page.tsx                          # Call screen
│   ├── dashboard/page.tsx                # Service request dashboard + calendar
│   └── api/
│       ├── session/route.ts              # xAI ephemeral token
│       ├── calls/route.ts                # Service request CRUD
│       ├── schedule/route.ts             # Workflow trigger + resume
│       ├── customer-lookup/route.ts      # Phone-based customer lookup
│       └── scheduled-services/route.ts   # Calendar data
├── components/
│   ├── CallScreen.tsx                    # Call flow orchestrator
│   ├── PhoneRinging.tsx                  # Ring animation
│   ├── ActiveCall.tsx                    # Active call UI with waveforms
│   ├── WaveformVisualizer.tsx            # Audio visualization
│   ├── LiveTranscript.tsx                # Real-time transcript display
│   ├── CallSummary.tsx                   # Post-call summary
│   ├── CallCard.tsx                      # Dashboard service request card
│   ├── UrgencyGauge.tsx                  # Circular urgency indicator
│   └── ServiceCalendar.tsx              # Scheduled services calendar
├── hooks/
│   └── useVoiceSession.ts               # WebSocket voice session management
├── lib/
│   ├── agent-config.ts                  # xAI voice agent config + tools
│   └── convex.ts                        # Convex client setup
└── mastra/
    ├── index.ts                         # Mastra instance config
    ├── agents/
    │   ├── intake-agent.ts              # Customer intake agent
    │   └── scheduling-agent.ts          # Appointment scheduling agent
    ├── tools/
    │   ├── intake-tools.ts              # Lookup, geocoding, save
    │   └── scheduling-tools.ts          # Availability, booking, bumping, email
    └── workflows/
        └── intake-scheduling-workflow.ts # End-to-end intake → booking pipeline

convex/
├── schema.ts                            # Database schema
├── customers.ts                         # Customer queries + mutations
├── technicians.ts                       # Technician management
├── serviceRequests.ts                   # Service request lifecycle
├── jobs.ts                              # Job scheduling + assignment
├── scheduledServices.ts                 # Calendar view data
├── agentDecisions.ts                    # Decision audit log
├── outgoingMessages.ts                  # Email/notification log
├── seed.ts                              # Development seed data
└── seedMigration.ts                     # Data migration utilities
```

## License

MIT
