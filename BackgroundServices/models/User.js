const mongoose =require("mongoose");

const userSchema = mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    password: { type: String, required: true },
    status: { type: Number, default: 0 },
    role: { type: String, default: "admin" },
  },
  {
    timestamps: true,
  }
);

const mongoose = require("mongoose");

const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  otp: String,              // Store OTP
  otpExpires: Date,         // OTP expiration time
  otpRequestTime: Date,     // Optional: rate limiting OTP requests
});

module.exports = mongoose.model("User", userSchema);
module.exports = mongoose.model("User", userSchema);
