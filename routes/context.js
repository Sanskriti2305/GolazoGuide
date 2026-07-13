const express = require('express');
const router = express.Router();

// The Context Engine — a single shared in-memory object (stadiumContext) that
// every other route reads from or writes to (chat.js uses crowdDensity/noiseLevel/
// language, sensoryMap.js and opsIntelligence.js use zones). Centralizing it here
// means all modules see the same live state without needing their own copies.
module.exports = (stadiumContext) => {
  // Lets the frontend poll/display current live conditions (e.g. a dashboard
  // showing current noise/crowd levels across zones)
  router.get('/', (req, res) => {
    res.json(stadiumContext);
  });

  // Generic merge-update endpoint — Object.assign lets any subset of context
  // fields (crowdDensity, noiseLevel, language, etc.) be updated without
  // needing a separate route per field
  router.post('/', (req, res) => {
    Object.assign(stadiumContext, req.body);
    res.json(stadiumContext);
  });

  // Resets zones to fixed demo values — useful for re-running the
  // Operational Intelligence demo (goal/red_card/halftime events) from a
  // known starting state instead of restarting the whole server
  router.post('/reset', (req, res) => {
    stadiumContext.zones = [
      { id: "A", name: "Section A", noise: 40, crowd: 30 },
      { id: "B", name: "Section B", noise: 85, crowd: 90 },
      { id: "C", name: "Section C", noise: 20, crowd: 15 },
      { id: "D", name: "Section D", noise: 60, crowd: 50 },
    ];
    res.json({ message: "Context reset", zones: stadiumContext.zones });
  });

  return router;
};