const express = require("express");
const app = express();
const dotenv = require("dotenv");
const cron = require('node-cron');
const dbConnection = require("./utils/db");
const { sendDetailsProspectEmail } = require("./EmailServices/sendDetailProspect");
const { sendEligibilityEmail } = require("./EmailServices/sendEligibilityEmail");
const { sendBloodDonationReminder } = require("./EmailServices/SendBloodDonationReminder");
const { sendDonorDetailsEmail } = require("./EmailServices/sendDonorEmail");
dotenv.config();


//SERVER
const PORT = process.env.PORT || 8002;

// SCHEDULE TASK

const run = () =>{
cron.schedule('* * * * *', () => {
  sendDetailsProspectEmail();
  sendEligibilityEmail();
  sendBloodDonationReminder();
  sendDonorDetailsEmail();
  console.log('running a task every second');
});
}
run();

app.listen(PORT, () => {
    console.log(`BackgroundServices is running on ${PORT}`);
    dbConnection();
})

