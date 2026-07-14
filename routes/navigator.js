const express = require('express');
const router = express.Router();

// Dijkstra's algorithm over an adjacency list built from stadium map nodes/edges.
// Exported standalone (not wrapped in the route) so Jest can unit-test the
// pathfinding logic in isolation, without spinning up Express or Supabase.
function findShortestPath(map, start, end) {
  const distances = {};   // shortest known distance from `start` to each node
  const previous = {};    // used to walk backwards and reconstruct the final path
  const unvisited = new Set(map.nodes);

  // Every node starts "unreachable" except the start node itself
  map.nodes.forEach(node => distances[node] = Infinity);
  distances[start] = 0;

  while (unvisited.size > 0) {
    // Linear scan for the closest unvisited node — no priority queue.
    // Fine for stadium-sized graphs (dozens/hundreds of nodes), but would
    // need a min-heap to stay efficient at city-scale graph sizes.
    let current = null;
    let smallestDist = Infinity;
    for (const node of unvisited) {
      if (distances[node] < smallestDist) {
        smallestDist = distances[node];
        current = node;
      }
    }

    // No reachable node left (current === null), or we've reached the
    // destination early — either way, no point visiting further nodes.
    if (current === null || current === end) break;
    unvisited.delete(current);

    // Edges are undirected (walkways go both ways), so match on either end
    const neighbors = map.edges.filter(e => e.from === current || e.to === current);
    for (const edge of neighbors) {
      const neighbor = edge.from === current ? edge.to : edge.from;
      const newDist = distances[current] + edge.distance;
      if (newDist < distances[neighbor]) {
        distances[neighbor] = newDist;
        previous[neighbor] = current; // remember how we got here, for backtracking
      }
    }
  }

  // Walk backwards from `end` to `start` using the `previous` map
  const path = [];
  let step = end;
  while (step) {
    path.unshift(step);
    step = previous[step];
  }

  // If backtracking didn't lead back to `start`, no valid path exists
  // (e.g. end node was never reached, or start/end aren't connected)
  return path[0] === start ? path : null;
}
module.exports.findShortestPath = findShortestPath;


// Factory function (not a plain router export) because this route needs the
// Gemini model instance and Supabase client injected from server.js, rather
// than creating its own — keeps config/credentials centralized in one place.
module.exports.createRouter = (model, supabase) => {
  router.post('/route', async (req, res) => {
    const { stadiumId, from, to } = req.body;
    if (!stadiumId || !from || !to) {
      return res.status(400).json({ directions: "stadiumId, from, and to are all required." });
    }

    // Map data (nodes/edges/image) lives in Supabase per-venue, built earlier
    // by the Map Builder/digitizer feature
    const { data: mapData, error } = await supabase
      .from('stadium_maps')
      .select('*')
      .eq('id', stadiumId)
      .single();

    if (error) return res.status(404).json({ directions: "Stadium map not found." });

    const path = findShortestPath(mapData, from, to);

    if (!path) {
      return res.status(404).json({ directions: "No route found between those points." });
    }

    // Raw path is just node IDs (e.g. "GateA -> Sec12 -> Seat45") — not useful
    // spoken aloud, so Gemini rephrases it into audio-friendly, step-by-step
    // spoken directions for blind/low-vision fans (no visual language)
    const navPrompt = `
You are an accessibility navigation assistant for a visually impaired fan.
Convert this raw path into short, clear, spoken-style step-by-step directions: 
${path.join(" -> ")}. 
Keep it to simple audio-friendly steps, no visual words like "see" or "look".
`;

    try {
      const result = await model.generateContent(navPrompt);
      res.json({ path, directions: result.response.text() });
    } catch (err) {
      // Gemini call failing shouldn't break navigation entirely — fall back
      // to the raw path so the fan still gets *something* usable
      console.error("NAVIGATOR ERROR:", err.message);
      res.status(500).json({ path, directions: "Could not generate spoken directions, but path found: " + path.join(" -> ") });
    }
  });

  return router;
};