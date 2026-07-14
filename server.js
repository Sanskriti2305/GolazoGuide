require('dotenv').config(); // loads GEMINI_API_KEY, SUPABASE_URL, SUPABASE_KEY from .env — never commit this file
const express = require('express');
const rateLimit = require('express-rate-limit');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { createClient } = require('@supabase/supabase-js');
const authRoutes = require("./routes/auth");
const compression = require('compression');

const app = express();
app.use(compression()); // gzip responses — smaller payloads, faster load, standard production practice
const PORT = process.env.PORT || 3000; // platform-injected PORT in production, falls back to 3000 locally

app.use(express.static('public')); // serves index.html, auth.html, and all frontend JS/CSS as static files
app.use(express.json({ limit: '10mb' })); // 10mb cap needed for base64 camera/seating-chart images (Vision Assist, Map Analyzer)

// Single Gemini client + model instance, reused across all routes rather than
// creating a new one per-request — cheaper and keeps the googleSearch tool
// grounding config defined in exactly one place
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" , tools: [{ googleSearch: {} }]});

// Anonymous/service-level client — used only for things that don't need a
// specific logged-in user's identity (e.g. verifying tokens in requireAuth).
// Routes that read/write RLS-protected tables build their own per-request
// client instead (see userSupabase pattern in chat.js, mapAnalyzer.js).
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// requireAuth needs `supabase` to already exist (it verifies session tokens
// against it), so this must come after createClient(), not before
const requireAuth = require('./middleware/requireAuth')(supabase);

// Limits repeated calls to Gemini-backed routes — protects free-tier quota
// from being exhausted by rapid/accidental repeated requests
const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // max 10 requests per minute per IP
  message: { error: "Too many requests — please wait a moment and try again." }
});

// The Context Engine's live state — a single shared object passed by reference
// into every route that needs it (chat, sensoryMap, opsIntelligence, context).
// Starts with demo defaults so the app has something to show before any real
// event/context updates come in.
let stadiumContext = {
  crowdDensity: "low",
  noiseLevel: "normal",
  language: "en",
  zones: [
    { id: "A", name: "Section A", noise: 40, crowd: 30 },
    { id: "B", name: "Section B", noise: 85, crowd: 90 },
    { id: "C", name: "Section C", noise: 20, crowd: 15 },
    { id: "D", name: "Section D", noise: 60, crowd: 50 },
  ],
};

// Every route now requires a valid logged-in session (requireAuth) — this
// closes the gap where routes were only "protected" by the frontend
// redirecting unauthenticated users, which never stopped direct API calls.
// /auth (signup/login) is intentionally left open, since a user isn't
// logged in yet when they're trying to log in.
app.use('/api/chat', requireAuth, aiLimiter, require('./routes/chat')(model, supabase, stadiumContext));
app.use('/api/context', requireAuth, require('./routes/context')(stadiumContext));
app.use('/api/sensory-map', requireAuth, require('./routes/sensoryMap').createRouter(stadiumContext));
app.use('/api/ops', requireAuth, aiLimiter, require('./routes/opsIntelligence').createRouter(model, stadiumContext));
app.use('/api/map', requireAuth, aiLimiter, require('./routes/mapAnalyzer')(model, supabase));
app.use('/api/navigator', requireAuth, require('./routes/navigator').createRouter(model, supabase));
app.use('/api/vision', requireAuth, aiLimiter, require('./routes/visionAssist')(model));
app.use("/auth", authRoutes(supabase));

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});