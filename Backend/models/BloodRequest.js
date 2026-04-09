const mongoose = require("mongoose");

const MessageSchema = mongoose.Schema(
  {
    text: { type: String },
    sender: { type: String },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const ManifestSchema = mongoose.Schema(
  {
    bagId: { type: String },
    component: { type: String },
    temperature: { type: String },
    eta: { type: String },
    fromHospital: { type: String },
  },
  { _id: false }
);

const BloodRequestSchema = mongoose.Schema(
  {
    patientName: { type: String, required: true },
    bloodGroup: { type: String, required: true },
    units: { type: Number, required: true },
    component: { type: String, default: "whole" },
    urgency: { type: String, default: "normal" },
    hospitalName: { type: String },
    contactName: { type: String },
    contactPhone: { type: String },
    contactEmail: { type: String },
    location: { type: String },
    notes: { type: String },
    status: { type: String, default: "pending" },
    messages: { type: [MessageSchema], default: [] },
    manifest: { type: ManifestSchema, default: null },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("BloodRequest", BloodRequestSchema);
