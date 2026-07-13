const express = require('express');
const router = express.Router();

module.exports = (model) => {
  // Vision Assist: takes a live camera frame from a blind/low-vision fan's
  // device and asks Gemini vision to describe it aloud (paired with frontend
  // text-to-speech). Three modes share one endpoint since they all follow
  // the same image-in/spoken-text-out shape — just different prompts.
  router.post('/describe', async (req, res) => {
    const { imageBase64, mimeType, mode } = req.body;

    let prompt;
    if (mode === "seat") {
      // Fan is trying to confirm they're in the right seat — narrow the
      // ask to just seat/row/section text, not a general scene description
      prompt = "Read any seat numbers, row numbers, or section numbers visible in this image. Respond in one short spoken sentence, e.g. 'This is Seat 14, Row B, Section 204.' If none are visible, say so simply.";
    } else if (mode === "sign") {
      // Fan is trying to find a restroom/exit/etc — read signage text
      // specifically rather than describing the whole scene
      prompt = "Read any text on signage in this image (like restroom, exit, or directional signs). Respond in one short spoken sentence describing what the sign says and what it indicates.";
    } else {
      // Default/general mode — free-roam navigation assistance, prioritizing
      // safety-relevant obstacles over general scene description
      prompt = "Describe what is directly in front of the camera in one or two short spoken sentences, focused on anything relevant for a blind person navigating (obstacles, doors, stairs, people, signage).";
    }

    try {
      const result = await model.generateContent([
        { inlineData: { data: imageBase64, mimeType } },
        prompt,
      ]);
      res.json({ description: result.response.text() });
    } catch (err) {
      console.error("VISION ASSIST ERROR:", err.message);
      res.status(500).json({ description: "Could not analyze image right now." });
    }
  });

  return router;
};