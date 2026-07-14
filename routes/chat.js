const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');

// Direct export of a factory function (this file only has one router,
// unlike navigator.js which also exports a standalone testable function)
module.exports = (model, supabase, stadiumContext) => {
  router.post('/', async (req, res) => {
    const userMessage = req.body.message;
    if (!userMessage || typeof userMessage !== 'string' || userMessage.trim().length === 0) {
      return res.status(400).json({ reply: "Message cannot be empty." });
    }
    // A client scoped to THIS user's token — so RLS's auth.uid() correctly
    // resolves to req.user.id, instead of null (which happens with the
    // shared anonymous client from server.js)
    const userSupabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY, {
      global: { headers: { Authorization: `Bearer ${req.token}` } }
    });

    // Context Engine values (crowdDensity/noiseLevel/language) are injected
    // live so the AI's answer reflects *current* stadium conditions, not
    // just the fan's raw question in isolation
    const contextPrompt = `
You are a helpful stadium assistant for FIFA World Cup 2026.
Today's real-world date is ${new Date().toDateString()}.
Current conditions: crowd density is ${stadiumContext.crowdDensity}, 
noise level is ${stadiumContext.noiseLevel}. 
Respond to the fan in this language: ${stadiumContext.language}.
Use your search tool whenever a question needs real, current, or factual information you're unsure of — not just for match schedules.

Fan's question: ${userMessage}
`;
    try {
      const result = await model.generateContent(contextPrompt);
      const reply = result.response.text();

      // Log every exchange for history/audit — failure here shouldn't block
      // the fan from getting their reply, so we just log and continue
      const { error } = await userSupabase
      .from('messages')
      .insert([{ user_message: userMessage, ai_reply: reply, user_id: req.user.id }]);

      if (error) console.log("SUPABASE INSERT ERROR:", error.message);
      res.json({ reply });
    } catch (err) {
      console.error("AI ERROR:", err.message);
      res.status(500).json({ reply: "Something went wrong, check logs." });
    }
  });

  // Returns past chat messages, most recent first, so the frontend can
  // render a scrollback / conversation history view
    router.get('/history', async (req, res) => {
    const userSupabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY, {
      global: { headers: { Authorization: `Bearer ${req.token}` } }
    });

    const { data, error } = await userSupabase
      .from('messages')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  });

  return router;
};