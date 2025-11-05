const express = require("express");
const {
  listMyEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  setStatus,
} = require("../controllers/eventController");
const { authRequired } = require("../middleware/auth");

const router = express.Router();

router.use(authRequired);
router.get("/", listMyEvents);
router.post("/", createEvent);
router.put("/:id", updateEvent);
router.delete("/:id", deleteEvent);
router.patch("/:id/status", setStatus);

module.exports = router;
