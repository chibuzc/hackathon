var mongoose = require("mongoose");
var passportLocalMongoose = require("passport-local-mongoose");


var processorSchema = new mongoose.Schema({
    finalStat:          String,
    comments:           String,
    username:           String
})

processorSchema.plugin(passportLocalMongoose);
module.exports = mongoose.model("Processor", processorSchema)