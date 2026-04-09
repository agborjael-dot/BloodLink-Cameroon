const path = require("path");
const ejs = require("ejs");
const dotenv = require("dotenv");
const Donor = require("../models/Donor");
const sendMail = require("../helpers/sendmail");

dotenv.config();

const sendDonorDetailsEmail = async () => {
  const donors = await Donor.find({ status: 0 });
  if (!donors.length) {
    return;
  }

  const templatePath = path.join(
    __dirname,
    "..",
    "templates",
    "BloodDonationDonor.ejs"
  );

  for (const donor of donors) {
    try {
      const html = await ejs.renderFile(templatePath, {
        name: donor.name,
        email: donor.email,
        tel: donor.tel,
        address: donor.address,
        bloodgroup: donor.bloodgroup,
        diseases: donor.diseases,
        weight: donor.weight,
        bloodpressure: donor.bloodpressure,
        age: donor.age,
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
        $set: { status: 1 },
      });
    } catch (error) {
      console.log(error);
    }
  }
};

module.exports = { sendDonorDetailsEmail };
