const { Event, STATUS } = require("../models/Event");

async function listMyEvents(req, res) {
  const events = await Event.find({ userId: req.user.id }).sort({
    startTime: 1,
  });
  res.json(events);
}

async function createEvent(req, res) {
  const { title, startTime, endTime, status } = req.body;
  if (!title || !startTime || !endTime)
    return res.status(400).json({ message: "Missing fields" });
  const ev = await Event.create({
    title,
    startTime,
    endTime,
    status: status || STATUS.BUSY,
    userId: req.user.id,
  });
  res.status(201).json(ev);
}

async function updateEvent(req, res) {
  const { id } = req.params;
  const updates = req.body;
  const ev = await Event.findOneAndUpdate(
    { _id: id, userId: req.user.id },
    updates,
    { new: true }
  );
  if (!ev) return res.status(404).json({ message: "Not found" });
  res.json(ev);
}

async function deleteEvent(req, res) {
  const { id } = req.params;
  const ev = await Event.findOneAndDelete({ _id: id, userId: req.user.id });
  if (!ev) return res.status(404).json({ message: "Not found" });
  res.json({ ok: true });
}

async function setStatus(req, res) {
  const { id } = req.params;
  const { status } = req.body;
  if (!Object.values(STATUS).includes(status))
    return res.status(400).json({ message: "Invalid status" });
  const ev = await Event.findOneAndUpdate(
    { _id: id, userId: req.user.id },
    { status },
    { new: true }
  );
  if (!ev) return res.status(404).json({ message: "Not found" });
  res.json(ev);
}

module.exports = {
  listMyEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  setStatus,
  STATUS,
};
