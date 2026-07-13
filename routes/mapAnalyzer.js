const express = require('express');
const router = express.Router();

module.exports = (model, supabase) => {
  // Core of the Stadium Map Builder: takes an uploaded seating chart image
  // and asks Gemini's vision capability to locate every section/gate label
  // as x/y percentages, so the frontend can auto-place graph nodes without
  // a human manually clicking every seat section
  router.post('/analyze', async (req, res) => {
    const { imageBase64, mimeType } = req.body;

    // Percentages (not pixels) requested so coordinates stay valid regardless
    // of the actual image resolution/dimensions — frontend just multiplies
    // by its own rendered image size
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

      // Gemini sometimes wraps JSON in ```json fences despite instructions —
      // strip them before parsing so JSON.parse doesn't throw
      let text = result.response.text().trim();
      text = text.replace(/^```json/, '').replace(/```$/, '').trim();
      res.json(JSON.parse(text));
    } catch (err) {
      console.error("MAP ANALYZE ERROR:", err.message);
      res.status(500).json({ error: "Could not analyze map." });
    }
  });

  // Persists the finished map (after user reviews/adjusts the AI-detected
  // nodes on the frontend) so /navigator can later run pathfinding on it
  router.post('/save', async (req, res) => {
    const { name, nodes, edges, image } = req.body;
    // Dedupe nodes in case the AI (or user editing) produced duplicate labels
    const cleanNodes = [...new Set(nodes)];

    const { data, error } = await supabase
      .from('stadium_maps')
      .insert([{ name, nodes: cleanNodes, edges, image }])
      .select();

    if (error) return res.status(500).json({ error: error.message });
    res.json({ message: "Stadium map saved", id: data[0].id });
  });

  // Lightweight listing (no nodes/edges/image payload) so a "choose your
  // stadium" screen loads fast without pulling full map data for every venue
  router.get('/list', async (req, res) => {
    const { data, error } = await supabase
      .from('stadium_maps')
      .select('id, name, created_at')
      .order('created_at', { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  });

  // Full map fetch by ID — used when /navigator needs the actual
  // nodes/edges to run pathfinding, or when rendering the map image itself
  router.get('/:id', async (req, res) => {
    const { data, error } = await supabase
      .from('stadium_maps')
      .select('*')
      .eq('id', req.params.id)
      .single();
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  });
  
  return router;
};