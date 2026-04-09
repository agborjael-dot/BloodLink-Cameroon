const Drive = require("../models/Drive");

const createDrive = async (req, res) => {
  try {
    const { title, date, targetUnits } = req.body || {};
    if (!title || !date || !targetUnits) {
      return res.status(400).json("Missing required fields");
    }
    const drive = new Drive(req.body);
    const saved = await drive.save();
    res.status(201).json(saved);
  } catch (error) {
    res.status(500).json(error);
  }
};

const getDrives = async (req, res) => {
  try {
    const drives = await Drive.find().sort({ date: -1, createdAt: -1 });
    res.status(200).json(drives);
  } catch (error) {
    res.status(500).json(error);
  }
};

const updateDrive = async (req, res) => {
  try {
    const updated = await Drive.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );
    if (!updated) return res.status(404).json("Drive not found");
    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json(error);
  }
};

module.exports = { createDrive, getDrives, updateDrive };
