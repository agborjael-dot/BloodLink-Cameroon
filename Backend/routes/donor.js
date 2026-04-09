const express = require("express");
const {
  createDonor,
  getAlldonors,
  getCurrentDonorProfile,
  updateDonor,
  updateCurrentDonorProfile,
  getOneDonor,
  deleteDonor,
  getDonorsStats,
  recordDonation,
} = require("../controllers/donor");
const { verifyToken, verifyTokenAndAuthorization } = require("../middlewares/verifyToken");
const router = express.Router();

// ADD DONOR
router.post("/", verifyTokenAndAuthorization, createDonor);

// GET ALL DONORS
router.get("/", verifyTokenAndAuthorization, getAlldonors);

// GET CURRENT DONOR PROFILE
router.get("/me", verifyToken, getCurrentDonorProfile);

// UPDATE CURRENT DONOR PROFILE
router.put("/me", verifyToken, updateCurrentDonorProfile);

// UPDATE DONOR
router.put("/:id", verifyTokenAndAuthorization, updateDonor);

// RECORD DONATION
router.post("/:id/donate", verifyTokenAndAuthorization, recordDonation);

//GET ONE DONOR
router.get("/find/:id", verifyTokenAndAuthorization, getOneDonor);

//DELETE DONOR
router.delete("/:id", verifyTokenAndAuthorization, deleteDonor);

//DONOR STATS
router.get("/stats", verifyTokenAndAuthorization, getDonorsStats);


module.exports=router
