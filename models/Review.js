var mongoose = require("mongoose");
var Schema    = mongoose.Schema;
var passportLocalMongoose = require("passport-local-mongoose");

var reviewSchema = new mongoose.Schema({
    notes:              String,
    stat:               String,
    map:                String,
    username:           String
    
});

reviewSchema.plugin(passportLocalMongoose);
module.exports = mongoose.model("Review", reviewSchema);