const express = require("express");
const { loginUser, registerUser, resendOtp, verifyOtp } = require("../controllers/auth");
const router = express.Router();

// LOGIN ROUTER
router.post("/login", loginUser);

// REGISTER ROUTER
router.post("/register", registerUser);

// OTP ROUTERS
router.post("/verify-otp", verifyOtp);
router.post("/resend-otp", resendOtp);

module.exports = router;
