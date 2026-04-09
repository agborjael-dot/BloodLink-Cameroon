const path = require("path");
const ejs = require("ejs");
const dotenv = require("dotenv");
const Prospect = require("../models/Prospect");
const sendMail = require("../helpers/sendmail");

dotenv.config();

const sendEligibilityEmail = async () => {
  const prospects = await Prospect.find({ status: 0 });
  if (!prospects.length) {
    return;
  }

  const templatePath = path.join(
    __dirname,
    "..",
    "templates",
    "BloodDonationEligibility.ejs"
  );

  for (const prospect of prospects) {
    if (prospect.age >= 18 && prospect.weight >= 52) {
      continue;
    }

    try {
      const html = await ejs.renderFile(templatePath, {
        name: prospect.name,
        age: prospect.age,
        weight: prospect.weight,
      });

      const messageOption = {
        from: process.env.EMAIL,
        to: prospect.email,
        subject: "BloodLink, Thank you",
        html,
      };

      await sendMail(messageOption);
      await Prospect.findByIdAndDelete(prospect._id);
    } catch (error) {
      console.log(error);
    }
  }
};

module.exports = { sendEligibilityEmail };
