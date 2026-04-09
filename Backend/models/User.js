const mongoose = require("mongoose");

const UserSchema = mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true, lowercase: true },
  password: { type: String, required: true },
  status: { type: Number, default: 0 },
  role: { type: String, default: "user" },
  otpCodeHash: { type: String, default: null },
  otpExpiresAt: { type: Date, default: null },
  otpLastSentAt: { type: Date, default: null },
  otpAttempts: { type: Number, default: 0 },
}, {
  timestamps: true,
});

module.exports = mongoose.model("User", UserSchema);
