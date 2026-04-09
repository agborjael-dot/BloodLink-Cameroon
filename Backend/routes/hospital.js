const express = require("express");
const { getHospitalAvailability, createHospital, updateHospitalInventory } = require("../controllers/hospital");
const { verifyTokenAndAuthorization } = require("../middlewares/verifyToken");

const router = express.Router();

router.get("/availability", getHospitalAvailability);
router.post("/", verifyTokenAndAuthorization, createHospital);
router.put("/:id/inventory", verifyTokenAndAuthorization, updateHospitalInventory);

module.exports = router;
