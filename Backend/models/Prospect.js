const mongoose = require("mongoose");

const ProspectSchema = mongoose.Schema({
    name:{type:String, required:true, trim:true},
    email:{type:String, trim:true, lowercase:true, default:""},
    address:{type:String, trim:true, default:""},
    tel:{type:String, required:true, trim:true},
    bloodgroup:{type:String, required:true, trim:true},
    weight:{type:Number, default:null},
    date:{type:String, default:""},
    diseases:{type:String, trim:true, default:""},
    age:{type:Number, default:null},
    bloodpressure:{type:Number, default:null},
    status:{type:Number, default:0}
})

module.exports=mongoose.model("Prospect", ProspectSchema);
