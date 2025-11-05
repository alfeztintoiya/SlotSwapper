const mongoose = require("mongoose");

const STATUS = {
  BUSY: "BUSY",
  SWAPPABLE: "SWAPPABLE",
  SWAP_PENDING: "SWAP_PENDING",
};

const eventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    status: { type: String, enum: Object.values(STATUS), default: STATUS.BUSY },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

module.exports = {
  Event: mongoose.model("Event", eventSchema),
  STATUS,
};
