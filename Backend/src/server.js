const express = require("express");
const http = require("http");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const helmet = require("helmet");
const { Server } = require("socket.io");
const { env } = require("./config/env");
const { connectDB } = require("./db");
const authRoutes = require("./routes/authRoutes");
const eventRoutes = require("./routes/eventRoutes");
const swapRoutes = require("./routes/swapRoutes");
const { registerSocket } = require("./socket");

const app = express();
app.use(helmet());
app.use(express.json());
app.use(cookieParser());
// Support comma-separated list of origins in CORS_ORIGIN
const corsOrigins = String(env.CORS_ORIGIN || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
const corsOption =
  corsOrigins.length > 1 ? corsOrigins : corsOrigins[0] || env.CORS_ORIGIN;
app.use(
  cors({
    origin: corsOption,
    credentials: true,
  })
);

app.get("/api/health", (req, res) => res.json({ ok: true }));

app.use("/api/auth", authRoutes);
app.use("/api/events", eventRoutes);
app.use("/api", swapRoutes);

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: corsOption,
    credentials: true,
  },
});

registerSocket(io);
require("./socket").io = io; // export io for emitter helpers

connectDB().then(() => {
  server.listen(env.PORT, () => {
    console.log(`Server running on http://localhost:${env.PORT}`);
  });
});
