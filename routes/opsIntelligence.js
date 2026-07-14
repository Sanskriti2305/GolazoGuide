const express = require('express');
const router = express.Router();

// Pure function — takes current zones + an event type, returns updated zones.
// Exported standalone (like findShortestPath and classifyIntensity) so Jest
// can test the event math directly without needing Express or a live model.
function applyEvent(zones, event) {
  if (event === "goal") {
    return zones.map(z => ({
      ...z, noise: Math.min(100, z.noise + 40), crowd: Math.min(100, z.crowd + 20),
    }));
  } else if (event === "red_card") {
    return zones.map(z => ({
      ...z, noise: Math.min(100, z.noise + 25),
    }));
  } else if (event === "halftime") {
    return zones.map(z => ({
      ...z, crowd: Math.min(100, z.crowd + 50),
    }));
  }
  return zones; // unrecognized event — no change
}
module.exports.applyEvent = applyEvent;

module.exports.createRouter = (model, stadiumContext) => {
  router.post('/event', (req, res) => {
    const { event } = req.body;
    const validEvents = ["goal", "red_card", "halftime"];
    if (!validEvents.includes(event)) {
      return res.status(400).json({ message: `Invalid event type. Must be one of: ${validEvents.join(", ")}` });
    }
    stadiumContext.zones = applyEvent(stadiumContext.zones, event);
    res.json({ message: `Event '${event}' applied`, zones: stadiumContext.zones });
  });

  module.exports.createRouter = (model, stadiumContext) => {
  // Cache the last summary + a snapshot of the zone data that produced it.
  // If zones haven't changed since the last request, skip the Gemini call
  // entirely and return the cached summary — saves quota and latency.
  let cachedSummary = null;
  let cachedZonesSnapshot = null;

  router.post('/event', (req, res) => {
    const { event } = req.body;
    const validEvents = ["goal", "red_card", "halftime"];
    if (!validEvents.includes(event)) {
      return res.status(400).json({ message: `Invalid event type. Must be one of: ${validEvents.join(", ")}` });
    }
    stadiumContext.zones = applyEvent(stadiumContext.zones, event);
    res.json({ message: `Event '${event}' applied`, zones: stadiumContext.zones });
  });

  router.get('/summary', async (req, res) => {
    const currentSnapshot = JSON.stringify(stadiumContext.zones);

    // Zones unchanged since last request — return cached result, no Gemini call
    if (cachedSummary && currentSnapshot === cachedZonesSnapshot) {
      return res.json({ summary: cachedSummary, cached: true });
    }

    const summaryPrompt = `
    You are a stadium operations analyst. Based on this real-time zone data, write a 
    short, plain-language briefing (3-4 sentences max) for security/staff, highlighting 
    any zones needing attention and a recommended action.

    Zone data: ${JSON.stringify(stadiumContext.zones)}
    `;
        try {
          const result = await model.generateContent(summaryPrompt);
          cachedSummary = result.response.text();
          cachedZonesSnapshot = currentSnapshot;
          res.json({ summary: cachedSummary, cached: false });
        } catch (err) {
          console.error("OPS SUMMARY ERROR:", err.message);
          res.status(500).json({ summary: "Could not generate summary." });
        }
      });

      return router;
    };

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