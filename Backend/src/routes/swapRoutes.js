const express = require("express");
const {
  swappableSlots,
  createSwapRequest,
  respondToSwap,
  myRequests,
} = require("../controllers/swapController");
const { authRequired } = require("../middleware/auth");

const router = express.Router();

router.use(authRequired);
router.get("/swappable-slots", swappableSlots);
router.get("/requests", myRequests);
router.post("/swap-request", createSwapRequest);
router.post("/swap-response/:requestId", respondToSwap);

module.exports = router;
