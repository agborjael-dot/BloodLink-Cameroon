const path = require("path");
const ejs = require("ejs");
const dotenv = require("dotenv");
const Donor = require("../models/Donor");
const sendMail = require("../helpers/sendmail");

dotenv.config();

const formatDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}/${month}/${day}`;
};

const sendBloodDonationReminder = async () => {
  const donors = await Donor.find();
  if (!donors.length) {
    return;
  }

  const templatePath = path.join(
    __dirname,
    "..",
    "templates",
    "BloodDonationReminder.ejs"
  );

  for (const donor of donors) {
    if (!donor.date) {
      continue;
    }

    const donorDate = new Date(donor.date);
    if (Number.isNaN(donorDate.getTime())) {
      continue;
    }

    const today = new Date();
    if (donorDate > today) {
      continue;
    }

    const diffTime = today - donorDate;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays <= 60) {
      continue;
    }

    try {
      const html = await ejs.renderFile(templatePath, {
        name: donor.name,
        date: donor.date,
      });

      const messageOption = {
        from: process.env.EMAIL,
        to: donor.email,
        subject: "Hello, BloodLink Donor.",
        html,
      };

      await sendMail(messageOption);
      await Donor.findByIdAndUpdate(donor._id, {
        $set: { date: formatDate(today) },
      });
    } catch (error) {
      console.log(error);
    }
  }
};

module.exports = { sendBloodDonationReminder };
