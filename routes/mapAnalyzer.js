const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');

module.exports = (model, supabase) => {
  // Core of the Stadium Map Builder: takes an uploaded seating chart image
  // and asks Gemini's vision capability to locate every section/gate label
  // as x/y percentages, so the frontend can auto-place graph nodes without
  // a human manually clicking every seat section
  router.post('/analyze', async (req, res) => {
    const { imageBase64, mimeType } = req.body;

    const prompt = `
You are analyzing a stadium seating chart image. Identify every visible section number, 
gate label, or named area. For each one, estimate its center position as a PERCENTAGE 
of image width and height (0-100), based on where the text label appears.

Respond ONLY with valid JSON, no markdown, no explanation:
{ "labels": [ { "name": "204", "xPercent": 45.2, "yPercent": 22.1 }, ... ] }
`;

    try {
      const result = await model.generateContent([
        { inlineData: { data: imageBase64, mimeType } },
        prompt,
      ]);

      let text = result.response.text().trim();
      text = text.replace(/^```json/, '').replace(/```$/, '').trim();
      res.json(JSON.parse(text));
    } catch (err) {
      console.error("MAP ANALYZE ERROR:", err.message);
      res.status(500).json({ error: "Could not analyze map." });
    }
  });

  // Persists the finished map — now RLS-protected, so we need a client
  // scoped to the logged-in user's token, same pattern as chat.js, or
  // auth.uid() resolves to null and the insert gets silently rejected
router.post('/save', async (req, res) => {
  try {
    const userSupabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY, {
      global: { headers: { Authorization: `Bearer ${req.token}` } }
    });

    const { name, nodes, edges, image } = req.body;
    const cleanNodes = [...new Set(nodes)];

    const { data, error } = await userSupabase
      .from('stadium_maps')
      .insert([{ name, nodes: cleanNodes, edges, image }])
      .select();

    if (error) {
      console.error("MAP SAVE ERROR:", error);
      return res.status(500).json({ error: error.message });
    }
    res.json({ message: "Stadium map saved", id: data[0].id });
  } catch (err) {
    console.error("MAP SAVE CRASH:", err); // catches anything, not just Supabase-returned errors
    res.status(500).json({ error: err.message });
  }
});

  // Lightweight listing — same userSupabase pattern, since RLS now
  // requires an authenticated request even for reads
  router.get('/list', async (req, res) => {
    const userSupabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY, {
      global: { headers: { Authorization: `Bearer ${req.token}` } }
    });

    const { data, error } = await userSupabase
      .from('stadium_maps')
      .select('id, name, created_at')
      .order('created_at', { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  });

  // Full map fetch by ID — same pattern again
  router.get('/:id', async (req, res) => {
    const userSupabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY, {
      global: { headers: { Authorization: `Bearer ${req.token}` } }
    });

    const { data, error } = await userSupabase
      .from('stadium_maps')
      .select('*')
      .eq('id', req.params.id)
      .single();
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  });
  
  return router;
};