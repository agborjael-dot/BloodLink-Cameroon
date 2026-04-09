const express = require("express");
const {
  createHospitalApplication,
  getHospitalApplications,
  updateHospitalApplication,
  getOneHospitalApplication,
  deleteHospitalApplication,
} = require("../controllers/hospitalApplication");
const { verifyToken, verifyTokenAndSuperAdmin } = require("../middlewares/verifyToken");

const router = express.Router();

// AUTHENTICATED: submit hospital application
router.post("/", verifyToken, createHospitalApplication);

// ADMIN: review applications
router.get("/", verifyTokenAndSuperAdmin, getHospitalApplications);
router.put("/:id", verifyTokenAndSuperAdmin, updateHospitalApplication);
router.get("/find/:id", verifyTokenAndSuperAdmin, getOneHospitalApplication);
router.delete("/:id", verifyTokenAndSuperAdmin, deleteHospitalApplication);

module.exports = router;
