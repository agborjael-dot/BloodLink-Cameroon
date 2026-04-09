const mongoose = require("mongoose");

const TransferSchema = mongoose.Schema(
  {
    fromHospital: { type: String, required: true },
    toHospital: { type: String, required: true },
    bloodGroup: { type: String, required: true },
    units: { type: Number, required: true },
    status: { type: String, default: "pending" },
    eta: { type: String },
    notes: { type: String },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Transfer", TransferSchema);
