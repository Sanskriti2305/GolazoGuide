const express = require('express');
const router = express.Router();

// Pure function (no I/O, no side effects) — exported standalone like
// findShortestPath so Jest can test the classification thresholds directly
// without needing a running server or stadiumContext object
function classifyIntensity(zone) {
  const avgScore = (zone.noise + zone.crowd) / 2;
  let intensity = "calm";
  // Thresholds are simple fixed cutoffs for now — good enough for a demo,
  // but candidates for tuning once real crowd/noise data ranges are known
  if (avgScore > 70) intensity = "overwhelming";
  else if (avgScore > 40) intensity = "moderate";
  return { ...zone, intensity }; // spread preserves original zone fields (id, name, etc.)
}

module.exports.classifyIntensity = classifyIntensity;

// Factory takes stadiumContext directly (not model/supabase) — this route
// is pure computation over live context data, no AI or DB calls needed
module.exports.createRouter = (stadiumContext) => {
  router.get('/', (req, res) => {
    const zonesWithIntensity = stadiumContext.zones.map(classifyIntensity);
    res.json(zonesWithIntensity);
  });

  return router;
};