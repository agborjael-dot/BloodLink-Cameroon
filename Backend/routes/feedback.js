const express = require("express");
const { createFeedback, getFeedback } = require("../controllers/feedback");
const { verifyTokenAndAuthorization } = require("../middlewares/verifyToken");

const router = express.Router();

router.post("/", createFeedback);
router.get("/", verifyTokenAndAuthorization, getFeedback);

module.exports = router;
