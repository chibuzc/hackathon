var express = require("express");
var router = express.Router();
var Applicants = require("../models/Applicants");
var merge = require('merge-objects');
const util = require('util')
var fs = require("fs");
var S3FS = require("s3fs");
var multiparty = require ("connect-multiparty");
    multipartyMiddleware = multiparty();
    s3fsImpl = new S3FS("hackathonchibuz", {
        accessKeyId: process.env.s3fs_accessKeyId,
        secretAccessKey: process.env.s3fs_secretAccessKey
    });

    s3fsImpl.create()
var bodyParser = require('body-parser');
var validator = require('express-validator');

// middleware
router.use(bodyParser.urlencoded({ extended: false }));
router.use(validator());
router.use(multipartyMiddleware);

// renders an application form to a particular applicant using his unique ID
 router.get("/:id", function(req, res){
    Applicants.findById(req.params.id, function(err, applicant){
        if(err){
            console.log(err);
        }else{
            console.log(applicant);
            res.render("reg", {Applicants: applicant});
        }
    });
});

//submits the form and render a second part of the form
 router.post("/:id/confirm", function(req, res){
    Applicants.findById(req.params.id, function(err, applicant){
        if(err){
            console.log(err);
        }else{
            console.log("files = " + req.files.image)
             console.log(util.inspect(req.files.image, false, null))
                console.log(util.inspect(req.body, false, null))
                req.checkBody("email", "Enter a valid email address.").isEmail();
                req.checkBody("firstname", "Should contain only letters.").isAlpha();
                req.checkBody("lastname", "Should contain only letters.").isAlpha();
                req.checkBody("sex", "Should contain only letters.").isAlpha();
                req.checkBody("stateOfOrigin", "Should contain only letters.").isAlpha();
                req.checkBody("occupation", "Should contain only letters.").isAlpha();
                
                
                  var errors = req.validationErrors();
                      if (errors) {
                        console.log(util.inspect(errors, false, null))
                        res.render("bad", {errors: errors});
                      } else {

                        var image = req.files.image;
                        var doc1 = req.files.doc1;
                        var doc2 = req.files.doc2;
                        var stream = fs.createReadStream(image.path);
                        var streamOne = fs.createReadStream(doc1.path);
                        var streamTwo = fs.createReadStream(doc2.path)
                        if(image.type === "image/jpeg" && doc1.type === "image/jpeg" && doc2.type === "image/jpeg"){
                            return s3fsImpl.writeFile(image.originalFilename, stream).then(function () {
                            fs.unlink(image.path, function (err) {
                                if (err) {
                                    console.error(err);
                                }
                            });
                            s3fsImpl.writeFile(doc1.originalFilename, streamOne).then(function () {
                            fs.unlink(doc1.path, function (err) {
                                if (err) {
                                    console.error(err);
                                }
                                });
                            s3fsImpl.writeFile(doc2.originalFilename, streamTwo).then(function () {
                            fs.unlink(doc2.path, function (err) {
                                if (err) {
                                    console.error(err);
                                }
                                var updateApplicant = merge(applicant, req.body);
                                applicant.image = image.name;
                                applicant.doc1 = doc1.name;
                                console.log("docc1 "+ doc1.name)
                                applicant.doc2 = doc2.name;
                                applicant.save();
                                res.render("show", {Applicants: applicant} )//.end();
                                  });
                                });

                            })
                        })  

                        }else{
                            res.render("fileError");
                        }
                        
                 
                       
                      }
              };
    });
});

//submits the second part of the form
 router.post("/:id/apply", function(req, res){
    Applicants.findById(req.params.id,function(err, applicant){
        if(err){
            console.log(err)
        }else{
            console.log("Bbody2")
            console.log(util.inspect(req.body, false, null))
            req.checkBody("applicationType", "Should contain only letters.").isAlpha();
            req.checkBody("testScore", "Should contain only letters.").isNumeric();
            req.checkBody("stateIssued", "Should contain only letters.").isAlpha();
            // req.checkBody("renewals", "Should contain only letters.").isAlpha();
              var errors = req.validationErrors();
              if (errors) {
                    res.render("bad", {errors: errors});
                  } else {
                    // normal processing here
                    var updateApplicant = merge(applicant, req.body);
                    applicant.save(function(err, applicant){
                        if (err){
                            console.log(err);
                        }else{
                            res.send("Your Application has been sent. Check your email regularly");
                        }
                    });
                  }
            
        }
    });
});

module.exports = router;