const express = require("express");
const { signup, login, me, logout } = require("../controllers/authController");
const { authRequired } = require("../middleware/auth");

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", authRequired, logout);
router.get("/me", authRequired, me);

module.exports = router;
