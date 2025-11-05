const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { env } = require("../config/env");

function setTokenCookie(res, userId) {
  const token = jwt.sign({ id: userId }, env.JWT_SECRET, { expiresIn: "7d" });
  const isCrossSiteProd =
    env.NODE_ENV === "production" &&
    !String(env.CORS_ORIGIN || "").includes("localhost");
  res.cookie(env.COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: isCrossSiteProd ? "none" : "lax",
    secure: isCrossSiteProd,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

async function signup(req, res) {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ message: "Missing fields" });
    const exists = await User.findOne({ email });
    if (exists)
      return res.status(409).json({ message: "Email already registered" });
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, passwordHash });
    setTokenCookie(res, user._id.toString());
    res.json({ id: user._id, name: user.name, email: user.email });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ message: "Invalid credentials" });
    setTokenCookie(res, user._id.toString());
    res.json({ id: user._id, name: user.name, email: user.email });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
}

async function me(req, res) {
  try {
    const user = await User.findById(req.user.id).select("_id name email");
    if (!user) return res.status(401).json({ message: "Unauthorized" });
    res.json({ id: user._id, name: user.name, email: user.email });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
}

async function logout(req, res) {
  const isCrossSiteProd =
    env.NODE_ENV === "production" &&
    !String(env.CORS_ORIGIN || "").includes("localhost");
  res.clearCookie(env.COOKIE_NAME, {
    httpOnly: true,
    sameSite: isCrossSiteProd ? "none" : "lax",
    secure: isCrossSiteProd,
  });
  res.json({ ok: true });
}

module.exports = { signup, login, me, logout };
