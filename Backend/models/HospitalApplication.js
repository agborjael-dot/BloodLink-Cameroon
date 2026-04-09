const mongoose = require("mongoose");

const HospitalApplicationSchema = mongoose.Schema(
  {
    facilityName: { type: String, required: true },
    facilityType: { type: String, required: true },
    region: { type: String, required: true },
    address: { type: String },
    licenseNumber: { type: String },
    accreditationName: { type: String },
    contactPerson: { type: String },
    email: { type: String },
    phone: { type: String },
    website: { type: String },
    notes: { type: String },
    status: { type: String, default: "pending" },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("HospitalApplication", HospitalApplicationSchema);
