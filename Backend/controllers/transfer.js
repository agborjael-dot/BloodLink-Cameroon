const Transfer = require("../models/Transfer");

const createTransfer = async (req, res) => {
  try {
    const { fromHospital, toHospital, bloodGroup, units } = req.body || {};
    if (!fromHospital || !toHospital || !bloodGroup || !units) {
      return res.status(400).json("Missing required fields");
    }
    const transfer = new Transfer({
      ...req.body,
      status: req.body.status || "pending",
    });
    const saved = await transfer.save();
    res.status(201).json(saved);
  } catch (error) {
    res.status(500).json(error);
  }
};

const getTransfers = async (req, res) => {
  try {
    const transfers = await Transfer.find().sort({ createdAt: -1 });
    res.status(200).json(transfers);
  } catch (error) {
    res.status(500).json(error);
  }
};

const updateTransfer = async (req, res) => {
  try {
    const updated = await Transfer.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );
    if (!updated) return res.status(404).json("Transfer not found");
    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json(error);
  }
};

module.exports = { createTransfer, getTransfers, updateTransfer };
