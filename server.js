require('dotenv').config(); // loads GEMINI_API_KEY, SUPABASE_URL, SUPABASE_KEY from .env — never commit this file
const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { createClient } = require('@supabase/supabase-js');
const authRoutes = require("./routes/auth");
const compression = require('compression');

const app = express();
app.use(compression()); // gzip responses — smaller payloads, faster load, standard production practice
const PORT = process.env.PORT || 3000;

app.use(express.static('public')); // serves index.html, auth.html, and all frontend JS/CSS as static files
app.use(express.json({ limit: '10mb' })); // 10mb cap needed for base64 camera/seating-chart images (Vision Assist, Map Analyzer)

// Single Gemini client + model instance, reused across all routes rather than
// creating a new one per-request — cheaper and keeps the googleSearch tool
// grounding config defined in exactly one place
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" , tools: [{ googleSearch: {} }]});
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// requireAuth needs `supabase` to already exist (it verifies session tokens
// against it), so this must come after createClient(), not before
const requireAuth = require('./middleware/requireAuth')(supabase);

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

// Each route module is wired in here with exactly the dependencies it needs
// (model, supabase, stadiumContext) — keeps every route file free of direct
// imports/instantiation of its own AI client or DB connection, so they stay
// easy to unit test with mocked/fake versions instead
app.use('/api/chat', requireAuth, require('./routes/chat')(model, supabase, stadiumContext));
app.use('/api/context', require('./routes/context')(stadiumContext));
app.use('/api/sensory-map', require('./routes/sensoryMap').createRouter(stadiumContext));
app.use('/api/ops', requireAuth, require('./routes/opsIntelligence').createRouter(model, stadiumContext));
app.use('/api/map', require('./routes/mapAnalyzer')(model, supabase));
app.use('/api/navigator', require('./routes/navigator').createRouter(model, supabase));
app.use('/api/vision', require('./routes/visionAssist')(model));
app.use("/auth", authRoutes(supabase));

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});