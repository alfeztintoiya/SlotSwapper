const dotenv = require("dotenv");

dotenv.config();

const env = {
  PORT: Number(process.env.PORT) || 4000,
  MONGO_URI: process.env.MONGO_URI || "mongodb://localhost:27017/slotswapper",
  JWT_SECRET: process.env.JWT_SECRET || "dev_jwt_secret",
  CORS_ORIGIN: process.env.CORS_ORIGIN || "http://localhost:5173",
  COOKIE_NAME: process.env.COOKIE_NAME || "token",
  NODE_ENV: process.env.NODE_ENV || "development",
};

module.exports = { env };
