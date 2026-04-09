const express = require("express");
const { createDrive, getDrives, updateDrive } = require("../controllers/drive");
const { verifyTokenAndAuthorization } = require("../middlewares/verifyToken");

const router = express.Router();

router.get("/public", getDrives);
router.post("/", verifyTokenAndAuthorization, createDrive);
router.get("/", verifyTokenAndAuthorization, getDrives);
router.put("/:id", verifyTokenAndAuthorization, updateDrive);

module.exports = router;
