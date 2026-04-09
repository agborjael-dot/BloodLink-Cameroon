const BloodRequest = require("../models/BloodRequest");

const createBloodRequest = async (req, res) => {
  try {
    const { patientName, bloodGroup, units } = req.body || {};
    if (!patientName || !bloodGroup || !units) {
      return res.status(400).json("Missing required fields");
    }
    const request = new BloodRequest({
      ...req.body,
      status: "pending",
      component: req.body.component || "whole",
      messages: [
        {
          text: "Request submitted",
          sender: "system",
          createdAt: new Date(),
        },
      ],
    });
    const saved = await request.save();
    res.status(201).json(saved);
  } catch (error) {
    res.status(500).json(error);
  }
};

const getBloodRequests = async (req, res) => {
  try {
    const requests = await BloodRequest.find().sort({ createdAt: -1 });
    res.status(200).json(requests);
  } catch (error) {
    res.status(500).json(error);
  }
};

const getPublicBloodRequests = async (req, res) => {
  try {
    const { bloodGroup, status, limit } = req.query || {};
    const filters = {};

    if (bloodGroup) {
      filters.bloodGroup = bloodGroup;
    }

    if (status) {
      filters.status = status;
    } else {
      filters.status = { $in: ["pending", "approved"] };
    }

    const max = Number(limit);
    const query = BloodRequest.find(filters)
      .sort({ createdAt: -1 })
      .select("_id bloodGroup units urgency hospitalName location status createdAt");

    if (!Number.isNaN(max) && max > 0) {
      query.limit(max);
    } else {
      query.limit(10);
    }

    const requests = await query;
    res.status(200).json(requests);
  } catch (error) {
    res.status(500).json(error);
  }
};

const getPublicBloodRequest = async (req, res) => {
  try {
    const request = await BloodRequest.findById(req.params.id).select(
      "_id bloodGroup units status hospitalName createdAt manifest messages urgency"
    );
    if (!request) return res.status(404).json("Request not found");
    res.status(200).json(request);
  } catch (error) {
    res.status(500).json(error);
  }
};

const updateBloodRequest = async (req, res) => {
  try {
    const existing = await BloodRequest.findById(req.params.id);
    if (!existing) return res.status(404).json("Request not found");

    const update = { ...req.body };

    if (req.body.status && req.body.status !== existing.status) {
      const messages = existing.messages ? [...existing.messages] : [];
      messages.push({
        text: `Status updated to ${req.body.status}`,
        sender: "system",
        createdAt: new Date(),
      });
      update.messages = messages;

      if (req.body.status === "approved" && !existing.manifest) {
        update.manifest = {
          bagId: `BL-${Math.floor(1000 + Math.random() * 9000)}`,
          component: existing.component || "whole",
          temperature: "4C",
          eta: "45 mins",
          fromHospital: existing.hospitalName || "Central Hospital",
        };
      }
    }

    const updated = await BloodRequest.findByIdAndUpdate(
      req.params.id,
      { $set: update },
      { new: true }
    );
    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json(error);
  }
};

const getOneBloodRequest = async (req, res) => {
  try {
    const request = await BloodRequest.findById(req.params.id);
    res.status(200).json(request);
  } catch (error) {
    res.status(500).json(error);
  }
};

const deleteBloodRequest = async (req, res) => {
  try {
    await BloodRequest.findByIdAndDelete(req.params.id);
    res.status(200).json("Request deleted successfully");
  } catch (error) {
    res.status(500).json(error);
  }
};

module.exports = {
  createBloodRequest,
  getBloodRequests,
  getPublicBloodRequests,
  updateBloodRequest,
  getOneBloodRequest,
  getPublicBloodRequest,
  deleteBloodRequest,
};
