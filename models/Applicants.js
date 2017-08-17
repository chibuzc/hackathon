var mongoose = require("mongoose");
var Review = require("./Review");
var Process = require("./Processor");

var ApplicantsSchema = new mongoose.Schema({
    image:               String,
    firstname:           String,
    lastname:            String,
    map:                 String,
    dateOfBirth:         Number,
    sex:                 String,
    stateOfOrigin:       String,
    occupation:          String,
    address:             String,
    email:               String,
    doc1:                String,
    doc2:                String,
    applicationType:     String,
    testScore:           String,
    stateIssued:         String,
    renewals:            String,
    facebookId:          String,
    created:             {type: Date, default: Date.now},
    Review:              [Review.schema],
    Process:             [Process.schema]
})

module.exports = mongoose.model("Applicants", ApplicantsSchema)


