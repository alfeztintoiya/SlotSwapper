const mongoose = require("mongoose");
const { env } = require("./config/env");

async function connectDB() {
  try {
    mongoose.set("strictQuery", true);
    await mongoose.connect(env.MONGO_URI, {
      autoIndex: true,
    });
    console.log("MongoDB connected");
  } catch (err) {
    console.error("MongoDB connection error", err);
    process.exit(1);
  }
}

module.exports = { connectDB };
