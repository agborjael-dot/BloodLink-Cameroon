const mongoose = require("mongoose");

const DonationHistorySchema = mongoose.Schema(
  {
    date: { type: String, required: true },
    location: { type: String, default: "" },
    status: { type: String, default: "Completed" },
  },
  { _id: false }
);

const DonorSchema = mongoose.Schema({
    name:{type:String, require:true},
    email:{type:String, require:true},
    city:{type:String},
    address:{type:String},
    tel:{type:String},
    bloodgroup:{type:String},
    weight:{type:Number},
    date:{type:String},
    joined:{type:String},
    lastDonation:{type:String},
    nextEligible:{type:String},
    diseases:{type:String},
    age:{type:Number},
    bloodpressure:{type:Number},
    status:{type:String, default:"Active"},
    donationHistory: { type: [DonationHistorySchema], default: [] }
})

module.exports=mongoose.model("Donor", DonorSchema);
