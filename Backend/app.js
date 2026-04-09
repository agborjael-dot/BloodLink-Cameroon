const express = require("express");
const cors = require("cors");
const { isDatabaseReady } = require("./utils/db");
const app = express();
const authRoute = require("./routes/auth");
const donorRoute= require("./routes/donor");
const prospectRoute= require("./routes/prospect")
const hospitalApplicationRoute = require("./routes/hospitalApplication");
const bloodRequestRoute = require("./routes/bloodRequest");
const hospitalRoute = require("./routes/hospital");
const feedbackRoute = require("./routes/feedback");
const transferRoute = require("./routes/transfer");
const driveRoute = require("./routes/drive");
module.exports=app;

//CORS
app.use(cors());

// JSON
app.use(express.json());

app.use((req, res, next) => {
  if (!req.path.startsWith("/api/")) {
    return next();
  }

  if (isDatabaseReady()) {
    return next();
  }

  return res.status(503).json({
    message: "Database unavailable. Verify the MongoDB connection or Atlas IP whitelist.",
  });
});

// ROUTES
app.use("/api/v1/auth",authRoute);
app.use("/api/v1/donors", donorRoute);
app.use("/api/v1/prospects", prospectRoute);
app.use("/api/v1/hospital-applications", hospitalApplicationRoute);
app.use("/api/v1/blood-requests", bloodRequestRoute);
app.use("/api/v1/hospitals", hospitalRoute);
app.use("/api/v1/feedback", feedbackRoute);
app.use("/api/v1/transfers", transferRoute);
app.use("/api/v1/drives", driveRoute);
