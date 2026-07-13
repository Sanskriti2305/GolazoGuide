# Golazo Guide

**The assist behind every fan's golazo moment.**

Golazo Guide is a GenAI-powered stadium assistance platform built for FIFA World Cup 2026. It combines real-time crowd intelligence, AI-generated navigation, multilingual fan support, and live vision-based accessibility assistance into a single Express + Supabase + Gemini application.

---

## The Problem

World Cup stadiums are chaotic by design — massive crowds, dozens of languages, unfamiliar layouts, and split-second operational decisions. Existing solutions solve this in fragments: one app for wayfinding, another for translation, another for crowd alerts, and almost nothing built for fans with visual or sensory needs.

Golazo Guide unifies this into one platform, backed by a shared **Context Engine** that every module reads from and writes to — so navigation, accessibility, and crowd intelligence all reflect the same live stadium state.

---

## What's Built

| Module | What it does | Backed by |
|---|---|---|
| **Volunteer/Fan Co-Pilot** | Context-aware multilingual chat — answers fan questions using live crowd/noise conditions and real-time web search grounding | Gemini 2.5 Flash + Google Search tool |
| **Sensory Load Map** | Classifies stadium zones into calm/moderate/overwhelming based on live noise + crowd scores | Custom classification logic (unit tested) |
| **Operational Intelligence** | Simulates live match events (goals, red cards, halftime) rippling through crowd/noise data, plus AI-generated plain-language staff briefings | Gemini 2.5 Flash |
| **AR Navigator** | Real Dijkstra's shortest-path routing across an AI-digitized stadium map, converted into spoken step-by-step directions | Custom pathfinding (unit tested) + Gemini + Web Speech API |
| **Vision Assist** | Live camera feed analyzed by Gemini vision (seat numbers, signage, general obstacles), read aloud via text-to-speech, for blind/low-vision fans | Gemini 2.5 Flash (vision) |
| **Stadium Map Builder** | Upload a seating chart image → Gemini vision extracts section/gate labels as coordinates → auto-connects a navigable graph → saved to Supabase | Gemini 2.5 Flash (vision) + Supabase |

All modules read from and write to a single shared **Stadium Context Engine** (`stadiumContext`), so a crowd surge triggered in Operational Intelligence is immediately visible in the Sensory Load Map, without duplicating state across features.

---

## Tech Stack

- **Backend:** Node.js + Express, routes split by feature (`routes/chat.js`, `navigator.js`, `sensoryMap.js`, `opsIntelligence.js`, `mapAnalyzer.js`, `context.js`, `visionAssist.js`, `auth.js`)
- **AI:** Google Gemini API (`@google/generative-ai`), model `gemini-2.5-flash`, with Google Search tool grounding for real-time factual answers
- **Database:** Supabase (Postgres) — `messages` (chat history, scoped per user) and `stadium_maps` (nodes/edges/image per venue)
- **Auth:** Supabase Auth — real signup/login, session-based route protection via custom Express middleware, profile dropdown + sign-out
- **Frontend:** Vanilla HTML/CSS/JS, single-page app with `.page` sections, dark glassmorphism UI
- **Testing:** Jest — unit tests for Dijkstra's pathfinding (`navigator.js`) and sensory zone classification (`sensoryMap.js`)

---

## Setup

1. Clone the repo and install dependencies:
   ```bash
   git clone https://github.com/Sanskriti2305/GolazoGuide.git
   cd GolazoGuide
   npm install
   ```

2. Create a `.env` file in the project root (never commit this file):
   ```
   GEMINI_API_KEY=your_gemini_api_key
   SUPABASE_URL=your_supabase_project_url
   SUPABASE_KEY=your_supabase_anon_key
   ```

3. Run the server:
   ```bash
   node server.js
   ```
   The app runs at `http://localhost:3000`.

4. Run the test suite:
   ```bash
   npm test
   ```

---

## Security

- Supabase Auth session tokens are verified server-side (not just checked client-side) via a custom `requireAuth` middleware, protecting the `/api/chat` routes from unauthenticated access
- Chat history is scoped per user (`user_id` filtering) — one fan cannot read another fan's conversation history
- The Supabase key used in frontend code is the public **anon** key, which is safe to expose by design; row-level security policies (not secret keys) are what actually gate data access
- `.env` is excluded via `.gitignore`, keeping the Gemini API key and Supabase credentials out of version control

---

## Accessibility

- ARIA roles and labels on all interactive elements
- Full keyboard navigation — Enter/Space activates custom controls, Enter submits every input field app-wide
- `aria-live` regions for dynamically updated content (chat replies, navigation directions, vision descriptions)
- Screen-reader-only labels (`sr-only`) on icon-only controls
- Skip-to-content link
- Spoken output (Web Speech API) for AR Navigator directions and Vision Assist descriptions, built specifically for blind/low-vision fans

---

## Testing

9 passing Jest tests covering:
- Dijkstra's shortest-path algorithm (`findShortestPath`) — correctness across multiple graph shapes, including unreachable nodes
- Sensory zone classification (`classifyIntensity`) — threshold boundaries for calm/moderate/overwhelming

Pure logic functions are exported separately from their Express routers specifically so they can be unit tested without spinning up a server or mocking HTTP requests.

---

## Known Limitations

Built under hackathon time constraints — documented here rather than hidden, since acknowledging tradeoffs is itself part of engineering judgment:

- Only the chat route currently enforces server-side auth; other routes (`navigator`, `sensory-map`, `ops`, `map`, `vision`) are not yet session-gated
- Shared in-memory `stadiumContext` state would not scale across multiple server instances without moving to a real datastore (e.g. Redis)
- Limited request body validation on some routes

---

## Team & Context

Built as a submission exploring how Generative AI can enhance stadium operations and fan accessibility for FIFA World Cup 2026 — covering navigation, accessibility, crowd management, and real-time decision support.

---

*Golazo Guide — "The assist behind every fan's golazo moment."*
