const bcrypt = require("bcrypt");
const CryptoJs = require("crypto-js");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const User = require("../models/User");
const { sendOtpEmail } = require("../utils/mail");

dotenv.config();

const OTP_EXPIRY_MINUTES = Number(process.env.OTP_EXPIRY_MINUTES || 10);
const OTP_RESEND_COOLDOWN_SECONDS = Number(process.env.OTP_RESEND_COOLDOWN_SECONDS || 60);
const OTP_MAX_ATTEMPTS = Number(process.env.OTP_MAX_ATTEMPTS || 5);
const ACCESS_TOKEN_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "12h";
const OTP_TOKEN_EXPIRES_IN = `${OTP_EXPIRY_MINUTES}m`;
const ADMIN_ROLES = ["admin", "superAdmin", "regional", "national"];

const normalizeEmail = (email = "") => email.trim().toLowerCase();

const isBcryptHash = (value = "") => /^\$2[aby]\$\d{2}\$/.test(value);

const sanitizeUser = (user) => {
  const safeUser = user.toObject();
  delete safeUser.password;
  delete safeUser.otpCodeHash;
  delete safeUser.otpExpiresAt;
  delete safeUser.otpLastSentAt;
  delete safeUser.otpAttempts;
  return safeUser;
};

const hashOtp = (otp) =>
  CryptoJs.HmacSHA256(
    otp,
    process.env.PASS_KEY || process.env.JWT_SECRET || "bloodlink-otp-secret"
  ).toString();

const buildAccessToken = (user) =>
  jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRES_IN,
  });

const buildOtpToken = (user) =>
  jwt.sign({ id: user._id, type: "otp" }, process.env.JWT_SECRET, {
    expiresIn: OTP_TOKEN_EXPIRES_IN,
  });

const clearOtpState = (user) => {
  user.otpCodeHash = null;
  user.otpExpiresAt = null;
  user.otpLastSentAt = null;
  user.otpAttempts = 0;
};

const generateOtp = () => `${Math.floor(100000 + Math.random() * 900000)}`;

const comparePassword = async (user, password) => {
  if (isBcryptHash(user.password)) {
    return bcrypt.compare(password, user.password);
  }

  if (!process.env.PASS_KEY) {
    return false;
  }

  try {
    const decrypted = CryptoJs.AES.decrypt(user.password, process.env.PASS_KEY).toString(
      CryptoJs.enc.Utf8
    );

    if (decrypted !== password) {
      return false;
    }

    user.password = await bcrypt.hash(password, 12);
    await user.save();
    return true;
  } catch (error) {
    return false;
  }
};

const issueOtp = async (user) => {
  const now = Date.now();

  if (user.otpLastSentAt) {
    const retryAfterMs =
      user.otpLastSentAt.getTime() + OTP_RESEND_COOLDOWN_SECONDS * 1000 - now;

    if (retryAfterMs > 0) {
      return {
        ok: false,
        retryAfterSeconds: Math.ceil(retryAfterMs / 1000),
      };
    }
  }

  const otp = generateOtp();
  user.otpCodeHash = hashOtp(otp);
  user.otpExpiresAt = new Date(now + OTP_EXPIRY_MINUTES * 60 * 1000);
  user.otpLastSentAt = new Date(now);
  user.otpAttempts = 0;
  await user.save();

  const delivery = await sendOtpEmail({
    email: user.email,
    name: user.name,
    otp,
    expiresInMinutes: OTP_EXPIRY_MINUTES,
  });

  return {
    ok: true,
    delivery,
    otpToken: buildOtpToken(user),
  };
};

const verifyOtpToken = (otpToken = "") => {
  try {
    const payload = jwt.verify(otpToken, process.env.JWT_SECRET);
    return payload.type === "otp" ? payload : null;
  } catch (error) {
    return null;
  }
};

const registerUser = async (req, res) => {
  const name = req.body.name?.trim();
  const email = normalizeEmail(req.body.email);
  const password = req.body.password || "";

  if (!name || !email || !password) {
    return res.status(400).json({ message: "Name, email, and password are required." });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: "A user with this email already exists." });
    }

    const isElevated =
      ADMIN_ROLES.includes(req.body.role) && req.body.adminKey === process.env.PASS_KEY;

    const user = await User.create({
      name,
      email,
      role: isElevated ? req.body.role : "user",
      password: await bcrypt.hash(password, 12),
    });

    return res.status(201).json({
      message: "Registration successful. You can now sign in.",
      user: sanitizeUser(user),
    });
  } catch (error) {
    return res.status(500).json({
      message: "Registration failed. Please try again.",
      error: error.message,
    });
  }
};

const loginUser = async (req, res) => {
  const email = normalizeEmail(req.body.email);
  const password = req.body.password || "";

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required." });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const isValidPassword = await comparePassword(user, password);
    if (!isValidPassword) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const otpResult = await issueOtp(user);
    if (!otpResult.ok) {
      return res.status(429).json({
        message: `Please wait ${otpResult.retryAfterSeconds} seconds before requesting another code.`,
      });
    }

    return res.status(200).json({
      requiresOtp: true,
      otpToken: otpResult.otpToken,
      message: otpResult.delivery.devFallback
        ? "OTP generated. Check the backend terminal because email is not configured yet."
        : "A verification code has been sent to your email.",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Login failed. Please verify your credentials and email setup.",
      error: error.message,
    });
  }
};

const resendOtp = async (req, res) => {
  const otpToken = req.body.otpToken || "";
  const payload = verifyOtpToken(otpToken);

  if (!payload) {
    return res.status(401).json({ message: "OTP session expired. Please sign in again." });
  }

  try {
    const user = await User.findById(payload.id);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const otpResult = await issueOtp(user);
    if (!otpResult.ok) {
      return res.status(429).json({
        message: `Please wait ${otpResult.retryAfterSeconds} seconds before requesting another code.`,
      });
    }

    return res.status(200).json({
      requiresOtp: true,
      otpToken: otpResult.otpToken,
      message: otpResult.delivery.devFallback
        ? "New OTP generated. Check the backend terminal because email is not configured yet."
        : "A new verification code has been sent to your email.",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Could not resend OTP. Please try again.",
      error: error.message,
    });
  }
};

const verifyOtp = async (req, res) => {
  const otpToken = req.body.otpToken || "";
  const otp = `${req.body.otp || ""}`.trim();
  const payload = verifyOtpToken(otpToken);

  if (!payload) {
    return res.status(401).json({ message: "OTP session expired. Please sign in again." });
  }

  if (!otp) {
    return res.status(400).json({ message: "OTP code is required." });
  }

  try {
    const user = await User.findById(payload.id);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    if (!user.otpCodeHash || !user.otpExpiresAt) {
      return res.status(400).json({ message: "No OTP request found. Please sign in again." });
    }

    if (user.otpExpiresAt.getTime() < Date.now()) {
      clearOtpState(user);
      await user.save();
      return res.status(400).json({ message: "OTP expired. Please sign in again." });
    }

    if (user.otpAttempts >= OTP_MAX_ATTEMPTS) {
      clearOtpState(user);
      await user.save();
      return res.status(429).json({
        message: "Too many incorrect OTP attempts. Please sign in again.",
      });
    }

    if (hashOtp(otp) !== user.otpCodeHash) {
      user.otpAttempts += 1;

      if (user.otpAttempts >= OTP_MAX_ATTEMPTS) {
        clearOtpState(user);
        await user.save();
        return res.status(429).json({
          message: "Too many incorrect OTP attempts. Please sign in again.",
        });
      }

      await user.save();
      return res.status(400).json({
        message: `Invalid OTP. ${OTP_MAX_ATTEMPTS - user.otpAttempts} attempt(s) remaining.`,
      });
    }

    clearOtpState(user);
    await user.save();

    const accessToken = buildAccessToken(user);

    return res.status(200).json({
      message: "Login successful.",
      token: accessToken,
      accessToken,
      user: sanitizeUser(user),
    });
  } catch (error) {
    return res.status(500).json({
      message: "OTP verification failed. Please try again.",
      error: error.message,
    });
  }
};

module.exports = { loginUser, registerUser, resendOtp, verifyOtp };
