const HospitalApplication = require("../models/HospitalApplication");

const createHospitalApplication = async (req, res) => {
  try {
    const { facilityName, facilityType, region, licenseNumber } = req.body || {};
    if (!facilityName || !facilityType || !region || !licenseNumber) {
      return res.status(400).json("Missing required fields");
    }
    const application = new HospitalApplication({
      ...req.body,
      status: "pending",
    });
    const saved = await application.save();
    res.status(201).json(saved);
  } catch (error) {
    res.status(500).json(error);
  }
};

const getHospitalApplications = async (req, res) => {
  try {
    const applications = await HospitalApplication.find().sort({ createdAt: -1 });
    res.status(200).json(applications);
  } catch (error) {
    res.status(500).json(error);
  }
};

const updateHospitalApplication = async (req, res) => {
  try {
    const updated = await HospitalApplication.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );
    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json(error);
  }
};

const getOneHospitalApplication = async (req, res) => {
  try {
    const application = await HospitalApplication.findById(req.params.id);
    res.status(200).json(application);
  } catch (error) {
    res.status(500).json(error);
  }
};

const deleteHospitalApplication = async (req, res) => {
  try {
    await HospitalApplication.findByIdAndDelete(req.params.id);
    res.status(200).json("Application deleted successfully");
  } catch (error) {
    res.status(500).json(error);
  }
};

module.exports = {
  createHospitalApplication,
  getHospitalApplications,
  updateHospitalApplication,
  getOneHospitalApplication,
  deleteHospitalApplication,
};
