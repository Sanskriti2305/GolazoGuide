const express = require('express');
const router = express.Router();

module.exports = (model, stadiumContext) => {
  // Simulates how in-match events ripple through the Sensory Load Map in
  // real time — lets the demo show crowd/noise reacting to gameplay without
  // needing a real live camera/mic feed wired up for the hackathon
  router.post('/event', (req, res) => {
    const { event } = req.body;
    if (event === "goal") {
      // Goals spike both noise and crowd movement — biggest combined jump
      stadiumContext.zones = stadiumContext.zones.map(z => ({
        ...z, noise: Math.min(100, z.noise + 40), crowd: Math.min(100, z.crowd + 20),
      }));
    } else if (event === "red_card") {
      // Red cards spike noise (reaction/booing) but don't move fans around much
      stadiumContext.zones = stadiumContext.zones.map(z => ({
        ...z, noise: Math.min(100, z.noise + 25),
      }));
    } else if (event === "halftime") {
      // Halftime moves people (concessions/restrooms) but isn't loud
      stadiumContext.zones = stadiumContext.zones.map(z => ({
        ...z, crowd: Math.min(100, z.crowd + 50),
      }));
    }
    // Math.min(100, ...) caps every value at 100 so repeated events
    // (e.g. two goals in a row) can't push scores past the intensity scale
    res.json({ message: `Event '${event}' applied`, zones: stadiumContext.zones });
  });

  // AI staff briefing — turns raw zone numbers into a short, actionable
  // summary a human security/ops team can scan in seconds during a live match
  router.get('/summary', async (req, res) => {
    const summaryPrompt = `
You are a stadium operations analyst. Based on this real-time zone data, write a 
short, plain-language briefing (3-4 sentences max) for security/staff, highlighting 
any zones needing attention and a recommended action.

Zone data: ${JSON.stringify(stadiumContext.zones)}
`;
    try {
      const result = await model.generateContent(summaryPrompt);
      res.json({ summary: result.response.text() });
    } catch (err) {
      console.error("OPS SUMMARY ERROR:", err.message);
      res.status(500).json({ summary: "Could not generate summary." });
    }
  });

  return router;
};