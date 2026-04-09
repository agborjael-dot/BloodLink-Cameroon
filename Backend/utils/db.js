const dotenv = require("dotenv");
const mongoose = require("mongoose");

dotenv.config();

const DB = process.env.DB;
let reconnectTimer = null;

mongoose.set("bufferCommands", false);

const scheduleReconnect = () => {
  if (reconnectTimer) return;

  reconnectTimer = setTimeout(async () => {
    reconnectTimer = null;
    await dbConnection();
  }, 5000);
};

const dbConnection = async () => {
  if (!DB) {
    console.error("Database connection string is missing.");
    return false;
  }

  if (mongoose.connection.readyState === 1 || mongoose.connection.readyState === 2) {
    return true;
  }

  try {
    await mongoose.connect(DB, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log("Database connected successfully");
    return true;
  } catch (error) {
    console.error("Database connection failed:", error.message);
    scheduleReconnect();
    return false;
  }
};

const isDatabaseReady = () => mongoose.connection.readyState === 1;

mongoose.connection.on("disconnected", () => {
  console.error("Database disconnected.");
  scheduleReconnect();
});

mongoose.connection.on("error", (error) => {
  console.error("Database error:", error.message);
});

module.exports = { dbConnection, isDatabaseReady };
