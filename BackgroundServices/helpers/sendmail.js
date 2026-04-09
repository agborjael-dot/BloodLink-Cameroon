const nodemailer = require("nodemailer");
const dotenv = require("dotenv");

dotenv.config();

const configurations = {
  service: "gmail",
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  requireTLS: true,
  auth: {
    user: process.env.EMAIL,
    pass: process.env.PASSWORD,
  },
};

const createTransporter = (config = configurations) =>
  nodemailer.createTransport(config);

const sendMail = async (messageOption) => {
  const transporter = createTransporter();
  await transporter.verify();
  return transporter.sendMail(messageOption);
};

module.exports = sendMail;
module.exports.createTransporter = createTransporter;
module.exports.configurations = configurations;
