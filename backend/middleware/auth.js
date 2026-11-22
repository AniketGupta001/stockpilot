const jwt = require("jsonwebtoken");
module.exports = function auth(req, res, next) {
  const value = req.headers.authorization || "";
  const token = value.startsWith("Bearer ") ? value.slice(7) : null;
  if (!token) return res.status(401).json({ message: "Please sign in" });
  try { req.user = jwt.verify(token, process.env.JWT_SECRET); next(); }
  catch { return res.status(401).json({ message: "Invalid or expired session" }); }
};