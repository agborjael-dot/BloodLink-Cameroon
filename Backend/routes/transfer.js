const express = require("express");
const { createTransfer, getTransfers, updateTransfer } = require("../controllers/transfer");
const { verifyTokenAndAuthorization } = require("../middlewares/verifyToken");

const router = express.Router();

// CREATE TRANSFER
router.post("/", verifyTokenAndAuthorization, createTransfer);

// GET ALL TRANSFERS
router.get("/", verifyTokenAndAuthorization, getTransfers);

// UPDATE TRANSFER
router.put("/:id", verifyTokenAndAuthorization, updateTransfer);

module.exports = router;
