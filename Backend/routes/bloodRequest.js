const express = require("express");
const {
  createBloodRequest,
  getBloodRequests,
  getPublicBloodRequests,
  updateBloodRequest,
  getOneBloodRequest,
  getPublicBloodRequest,
  deleteBloodRequest,
} = require("../controllers/bloodRequest");
const { verifyToken, verifyTokenAndAuthorization } = require("../middlewares/verifyToken");

const router = express.Router();

// AUTHENTICATED: submit blood request
router.post("/", verifyToken, createBloodRequest);
router.get("/public", getPublicBloodRequests);
// PUBLIC: fetch single request status
router.get("/public/:id", getPublicBloodRequest);

// ADMIN: review blood requests
router.get("/", verifyTokenAndAuthorization, getBloodRequests);
router.put("/:id", verifyTokenAndAuthorization, updateBloodRequest);
router.get("/find/:id", verifyTokenAndAuthorization, getOneBloodRequest);
router.delete("/:id", verifyTokenAndAuthorization, deleteBloodRequest);

module.exports = router;
