const { Event, STATUS } = require("../models/Event");
const { SwapRequest, SWAP_STATUS } = require("../models/SwapRequest");
const { getUserSockets, emitToUser } = require("../socket");

async function swappableSlots(req, res) {
  const slots = await Event.find({
    userId: { $ne: req.user.id },
    status: STATUS.SWAPPABLE,
  }).sort({ startTime: 1 });
  res.json(slots);
}

// Helper to atomically mark a slot SWAPPABLE->SWAP_PENDING (no transactions)
async function markPendingIfSwappable(eventId, userId) {
  return await Event.findOneAndUpdate(
    { _id: eventId, userId, status: STATUS.SWAPPABLE },
    { $set: { status: STATUS.SWAP_PENDING } },
    { new: true }
  );
}

async function createSwapRequest(req, res) {
  const { mySlotId, theirSlotId } = req.body;
  if (!mySlotId || !theirSlotId)
    return res.status(400).json({ message: "Missing slot ids" });

  const mySlot = await Event.findById(mySlotId);
  const theirSlot = await Event.findById(theirSlotId);
  if (!mySlot || !theirSlot)
    return res.status(404).json({ message: "Slot not found" });
  if (String(mySlot.userId) !== req.user.id)
    return res.status(403).json({ message: "Not your slot" });
  if (String(theirSlot.userId) === req.user.id)
    return res.status(400).json({ message: "Cannot swap with yourself" });

  // Optimistic two-step updates with best-effort rollback
  let updatedMine;
  let updatedTheirs;
  try {
    updatedMine = await markPendingIfSwappable(mySlotId, req.user.id);
    if (!updatedMine)
      return res.status(409).json({ message: "Your slot is not swappable" });

    updatedTheirs = await Event.findOneAndUpdate(
      { _id: theirSlotId, userId: theirSlot.userId, status: STATUS.SWAPPABLE },
      { $set: { status: STATUS.SWAP_PENDING } },
      { new: true }
    );
    if (!updatedTheirs) {
      // rollback mine
      await Event.updateOne(
        { _id: mySlotId, status: STATUS.SWAP_PENDING },
        { $set: { status: STATUS.SWAPPABLE } }
      );
      return res
        .status(409)
        .json({ message: "Target slot is not swappable anymore" });
    }

    const swap = await SwapRequest.create({
      requester: req.user.id,
      responder: theirSlot.userId,
      mySlot: mySlotId,
      theirSlot: theirSlotId,
      status: SWAP_STATUS.PENDING,
    });

    // Notify responder
    emitToUser(String(theirSlot.userId), "swap:request", {
      requestId: swap._id,
      mySlot: updatedMine,
      theirSlot: updatedTheirs,
    });

    res.status(201).json(swap);
  } catch (err) {
    console.error(err);
    // Best-effort rollback
    if (updatedMine)
      await Event.updateOne(
        { _id: mySlotId, status: STATUS.SWAP_PENDING },
        { $set: { status: STATUS.SWAPPABLE } }
      );
    if (updatedTheirs)
      await Event.updateOne(
        { _id: theirSlotId, status: STATUS.SWAP_PENDING },
        { $set: { status: STATUS.SWAPPABLE } }
      );
    res.status(500).json({ message: "Server error" });
  }
}

async function respondToSwap(req, res) {
  const { requestId } = req.params;
  const { accept } = req.body;
  const swap = await SwapRequest.findById(requestId);
  if (!swap) return res.status(404).json({ message: "Request not found" });
  if (String(swap.responder) !== req.user.id)
    return res.status(403).json({ message: "Not authorized" });
  if (swap.status !== SWAP_STATUS.PENDING)
    return res.status(400).json({ message: "Already handled" });

  try {
    const mySlot = await Event.findById(swap.mySlot);
    const theirSlot = await Event.findById(swap.theirSlot);
    if (!mySlot || !theirSlot)
      return res.status(404).json({ message: "Slots missing" });

    if (!accept) {
      await Event.updateOne(
        { _id: mySlot._id },
        { $set: { status: STATUS.SWAPPABLE } }
      );
      await Event.updateOne(
        { _id: theirSlot._id },
        { $set: { status: STATUS.SWAPPABLE } }
      );
      await SwapRequest.updateOne(
        { _id: swap._id, status: SWAP_STATUS.PENDING },
        { $set: { status: SWAP_STATUS.REJECTED } }
      );

      emitToUser(String(swap.requester), "swap:update", {
        requestId,
        status: SWAP_STATUS.REJECTED,
      });
      emitToUser(String(swap.responder), "swap:update", {
        requestId,
        status: SWAP_STATUS.REJECTED,
      });
      return res.json({ status: SWAP_STATUS.REJECTED });
    }

    // Accept path with optimistic guards (swap only time slots, not owners)
    const requesterId = String(swap.requester);
    const responderId = String(swap.responder);

    if (
      String(mySlot.userId) !== requesterId ||
      String(theirSlot.userId) !== responderId
    ) {
      return res
        .status(409)
        .json({ message: "Slots no longer valid for swap" });
    }

    const myTimes = {
      startTime: theirSlot.startTime,
      endTime: theirSlot.endTime,
    };
    const theirTimes = { startTime: mySlot.startTime, endTime: mySlot.endTime };

    const upd1 = await Event.updateOne(
      { _id: mySlot._id, userId: requesterId, status: STATUS.SWAP_PENDING },
      { $set: { ...myTimes, status: STATUS.BUSY } }
    );
    if (upd1.matchedCount !== 1)
      return res.status(409).json({ message: "Your slot changed state" });

    const upd2 = await Event.updateOne(
      { _id: theirSlot._id, userId: responderId, status: STATUS.SWAP_PENDING },
      { $set: { ...theirTimes, status: STATUS.BUSY } }
    );
    if (upd2.matchedCount !== 1) {
      // rollback first best-effort
      await Event.updateOne(
        { _id: mySlot._id, userId: requesterId, status: STATUS.BUSY },
        {
          $set: {
            startTime: theirTimes.startTime,
            endTime: theirTimes.endTime,
            status: STATUS.SWAP_PENDING,
          },
        }
      );
      return res.status(409).json({ message: "Target slot changed state" });
    }

    await SwapRequest.updateOne(
      { _id: swap._id, status: SWAP_STATUS.PENDING },
      { $set: { status: SWAP_STATUS.ACCEPTED } }
    );

    emitToUser(requesterId, "swap:update", {
      requestId,
      status: SWAP_STATUS.ACCEPTED,
    });
    emitToUser(responderId, "swap:update", {
      requestId,
      status: SWAP_STATUS.ACCEPTED,
    });

    res.json({ status: SWAP_STATUS.ACCEPTED });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
}

async function myRequests(req, res) {
  const incoming = await SwapRequest.find({ responder: req.user.id })
    .populate("mySlot")
    .populate("theirSlot")
    .sort({ createdAt: -1 });
  const outgoing = await SwapRequest.find({ requester: req.user.id })
    .populate("mySlot")
    .populate("theirSlot")
    .sort({ createdAt: -1 });
  res.json({ incoming, outgoing });
}

module.exports = {
  swappableSlots,
  createSwapRequest,
  respondToSwap,
  myRequests,
};
