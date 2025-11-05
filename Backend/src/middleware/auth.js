const jwt = require("jsonwebtoken");
const { env } = require("../config/env");

function authRequired(req, res, next) {
  try {
    const token = req.cookies[env.COOKIE_NAME];
    if (!token) return res.status(401).json({ message: "Unauthorized" });
    const payload = jwt.verify(token, env.JWT_SECRET);
    req.user = { id: payload.id };
    next();
  } catch (err) {
    return res.status(401).json({ message: "Unauthorized" });
  }
}

module.exports = { authRequired };
