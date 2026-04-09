const nodemailer = require("nodemailer");

const isPlaceholder = (value = "") =>
  ["your_email@gmail.com", "your_app_password", "your_email", "your_password"].includes(
    value.trim().toLowerCase()
  );

const getMailCredentials = () => ({
  user: isPlaceholder(process.env.EMAIL_USER || process.env.EMAIL || "")
    ? ""
    : process.env.EMAIL_USER || process.env.EMAIL || "",
  pass: isPlaceholder(process.env.EMAIL_PASS || process.env.PASSWORD || "")
    ? ""
    : process.env.EMAIL_PASS || process.env.PASSWORD || "",
});

const isMailConfigured = () => {
  const { user, pass } = getMailCredentials();
  return Boolean(user && pass);
};

const createTransporter = () => {
  const { user, pass } = getMailCredentials();

  if (!user || !pass) {
    throw new Error("Email delivery is not configured. Set EMAIL_USER and EMAIL_PASS in Backend/.env.");
  }

  return nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });
};

const sendOtpEmail = async ({ email, name, otp, expiresInMinutes }) => {
  const { user } = getMailCredentials();

  if (!isMailConfigured()) {
    if (process.env.NODE_ENV !== "production") {
      console.log(`[DEV OTP] ${email}: ${otp}`);
      return { devFallback: true };
    }

    throw new Error("Email delivery is not configured.");
  }

  const transporter = createTransporter();
  await transporter.sendMail({
    from: user,
    to: email,
    subject: "Your BloodLink verification code",
    text: `Hello ${name || "user"}, your BloodLink verification code is ${otp}. It expires in ${expiresInMinutes} minutes.`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2>BloodLink verification code</h2>
        <p>Hello ${name || "user"},</p>
        <p>Your one-time verification code is:</p>
        <p style="font-size: 24px; font-weight: 700; letter-spacing: 4px;">${otp}</p>
        <p>This code expires in ${expiresInMinutes} minutes.</p>
        <p>If you did not try to sign in, ignore this email.</p>
      </div>
    `,
  });

  return { devFallback: false };
};

module.exports = { sendOtpEmail, isMailConfigured };
