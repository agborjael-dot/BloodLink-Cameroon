const Feedback = require("../models/Feedback");

const createFeedback = async (req, res) => {
  try {
    const { message } = req.body || {};
    if (!message) {
      return res.status(400).json("Message is required");
    }
    const feedback = new Feedback(req.body);
    const saved = await feedback.save();
    res.status(201).json(saved);
  } catch (error) {
    res.status(500).json(error);
  }
};

const getFeedback = async (req, res) => {
  try {
    const feedback = await Feedback.find().sort({ createdAt: -1 });
    res.status(200).json(feedback);
  } catch (error) {
    res.status(500).json(error);
  }
};

module.exports = { createFeedback, getFeedback };
