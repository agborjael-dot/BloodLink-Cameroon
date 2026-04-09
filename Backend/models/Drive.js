const mongoose = require("mongoose");

const DriveSchema = mongoose.Schema(
  {
    title: { type: String, required: true },
    location: { type: String },
    date: { type: String, required: true },
    targetUnits: { type: Number, required: true },
    collectedUnits: { type: Number, default: 0 },
    status: { type: String, default: "upcoming" },
    notes: { type: String },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Drive", DriveSchema);
