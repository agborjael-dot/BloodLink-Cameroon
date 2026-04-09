const mongoose = require("mongoose");

const FeedbackSchema = mongoose.Schema(
  {
    type: { type: String },
    priority: { type: String },
    message: { type: String, required: true },
    requestId: { type: String },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Feedback", FeedbackSchema);
