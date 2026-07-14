// Verifies the Supabase session token sent from the frontend and attaches
// the logged-in user to req.user — without this, any route "protected" by
// frontend checkAuth() is still wide open to direct API calls
module.exports = (supabase) => {
  return async (req, res, next) => {
    const authHeader = req.headers.authorization; // expects "Bearer <token>"
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ error: "Not authenticated" });

    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) return res.status(401).json({ error: "Invalid or expired session" });

    req.user = data.user; // now available to any route after this middleware
    req.token = token;
    next();
  };
};