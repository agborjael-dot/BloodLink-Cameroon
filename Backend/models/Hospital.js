const mongoose = require("mongoose");

const InventorySchema = mongoose.Schema(
  {
    group: { type: String, required: true },
    component: { type: String, required: true },
    units: { type: Number, required: true },
  },
  { _id: false }
);

const HospitalSchema = mongoose.Schema(
  {
    name: { type: String, required: true },
    region: { type: String },
    location: { type: String },
    lat: { type: Number },
    lng: { type: Number },
    distanceKm: { type: Number },
    inventory: { type: [InventorySchema], default: [] },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Hospital", HospitalSchema);
