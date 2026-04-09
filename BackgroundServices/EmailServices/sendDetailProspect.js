const path = require("path");
const ejs = require("ejs");
const dotenv = require("dotenv");
const Prospect = require("../models/Prospect");
const sendMail = require("../helpers/sendmail");

dotenv.config();

const sendDetailsProspectEmail = async () => {
  const prospects = await Prospect.find({ status: 0 });
  if (!prospects.length) {
    return;
  }

  const templatePath = path.join(
    __dirname,
    "..",
    "templates",
    "BloodDonationProspect.ejs"
  );

  for (const prospect of prospects) {
    try {
      const html = await ejs.renderFile(templatePath, {
        name: prospect.name,
      });

      const messageOption = {
        from: process.env.EMAIL,
        to: prospect.email,
        subject: "BloodLink, Thank you",
        html,
      };

      await sendMail(messageOption);
      await Prospect.findByIdAndUpdate(prospect._id, {
        $set: { status: 1 },
      });
    } catch (error) {
      console.log(error);
    }
  }
};

module.exports = { sendDetailsProspectEmail };
