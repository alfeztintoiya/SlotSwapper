const cookie = require("cookie");
const jwt = require("jsonwebtoken");
const { env } = require("./config/env");

// userId -> Set(socketId)
const userSockets = new Map();
// socketId -> userId
const socketToUser = new Map();

function registerSocket(io) {
  io.use((socket, next) => {
    try {
      const header = socket.request.headers.cookie || "";
      const cookies = cookie.parse(header);
      const token = cookies[env.COOKIE_NAME];
      if (!token) return next();
      const payload = jwt.verify(token, env.JWT_SECRET);
      socket.userId = String(payload.id);
      next();
    } catch (err) {
      return next();
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.userId;
    if (userId) {
      if (!userSockets.has(userId)) userSockets.set(userId, new Set());
      userSockets.get(userId).add(socket.id);
      socketToUser.set(socket.id, userId);
    }

    socket.on("disconnect", () => {
      const uid = socketToUser.get(socket.id);
      if (uid) {
        const set = userSockets.get(uid);
        if (set) {
          set.delete(socket.id);
          if (set.size === 0) userSockets.delete(uid);
        }
        socketToUser.delete(socket.id);
      }
    });
  });
}

function getUserSockets(userId) {
  return userSockets.get(String(userId)) || new Set();
}

function emitToUser(userId, event, payload) {
  const io = module.exports.io;
  if (!io) return;
  const set = getUserSockets(userId);
  for (const sid of set) io.to(sid).emit(event, payload);
}

module.exports = { registerSocket, emitToUser, getUserSockets };
