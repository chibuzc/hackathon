var express = require("express");
var router = express.Router();
var Applicants = require("../models/Applicants");
var Review = require("../models/Review");
var nodemailer = require('nodemailer');
var NodeGeocoder = require('node-geocoder');
var passport = require("passport");
var LocalStrategy = require("passport-local");
var GoogleMapsAPI = require("googlemaps")

var publicConfig = {
  key: process.env.gmAPI_key,
  stagger_time:       1000, // for elevationPath 
  encode_polylines:   false,
  secure:             true, // use https
};
var gmAPI = new GoogleMapsAPI(publicConfig);
 
var options = {
  provider: 'google',
  httpAdapter: 'https', 
  apiKey: process.env.geocoder_apiKey, 
  formatter: null         
};
 
var geocoder = NodeGeocoder(options);


router.get("/review/dashboard/success", isLoggedIn, isReview, function(req, res){
    Applicants.find({}, function(err, Applicant){
        if(err){
            console.log(err);
        }else{
            var open = Applicant.filter(function(applicant){
                return(applicant.Review[0] === undefined);
             });
            var appr = Applicant.map(function(applicant){
                if(applicant.Review[0]===undefined){
                    return [];
                }else{
                    return(applicant.Review[0].stat);
                }
                  
            })
            var approved = appr.filter(function(appr){
                return (appr==="Approved")
            })

             var rej = Applicant.map(function(applicant){
                 if(applicant.Review[0]===undefined){
                     return []
                 }else{

                return(applicant.Review[0].stat)
                 }
            })
            var rejected = rej.filter(function(rej){
                return (rej==="Rejected")
            })
            
            res.render("reviewDashboard", {Applicant: Applicant, open: open, approved: approved, rejected: rejected})
        }
    })
 })

router.get("/review/:id", isLoggedIn, isReview, function(req, res){
    Applicants.findById(req.params.id,function(err, Applicants){
        if(err){
            console.log(err);
        }else{
            geocoder.geocode(Applicants.address, function(err, res){
                if(err){
                    console.log(err)
                }else{
                    console.log(res)
                }
            })
            console.log(req.user)
            res.render("review", {Applicants: Applicants });
        }
    });
});

// displays the applicant's location on map
router.get("/review/:id/location", function (req, res){
  Applicants.findById(req.params.id, function( err, Applicant){
    if(err){
      console.log(err)
    }else{
       var gmAPI = new GoogleMapsAPI(publicConfig);
        var params = {
          center: Applicant.address,
          zoom: 15,
          size: '500x400',
          maptype: 'roadmap',
          markers: [
            {
              location: Applicant.address,
              label   : 'A',
              color   : 'green',
              shadow  : true
            },
            {
              location: Applicant.address,
              icon: 'http://chart.apis.google.com/chart?chst=d_map_pin_icon&chld=cafe%7C996600'
            }
          ],
          style: [
            {
              feature: 'road',
              element: 'all',
              rules: {
                hue: '0x00ff00'
              }
            }
          ],
          path: [
            {
              color: '0x0000ff',
              weight: '5',
              points: [
                '41.139817,-77.454439',
                '41.138621,-77.451596'
              ]
            }
          ]
        };
    }
    var applicantLocation = gmAPI.staticMap(params)
    res.render("demo", {location: applicantLocation})
  })
})

router.post("/review/:id/done", isLoggedIn, isReview, function(req, res){
    Applicants.findById(req.params.id,function(err, Applicants){
        if(err){
            console.log(err);
        }else{
            Review.create(req.body.Review, function(err, Review){
                if(err){
                    console.log(err);
                }else{
                     Applicants.Review.push(Review);
                    Applicants.save(function(err, saved){
                      if(err){
                      console.log(err)
                      }else{
                        console.log("app" + saved)
                        var transport = nodemailer.createTransport({
                          service: 'gmail',
                          auth: {
                                  user: process.env.gmail_user,
                                  pass: process.env.gmail_pass
                          }
                      });
                    
                      var mailOptions = {
                        from: '<chalesbuzor@gmail.com>', // sender address
                        to: 'chibuzc@yahoo.co.uk', // list of receivers which in this case will be the reviewer's email
                        subject: 'Email Example', // Subject line
                        text: "http://localhost:8080/"+ saved._id+"/done/process"
                      };
                    
                      transport.sendMail(mailOptions, function(error, info){
                        if(error){
                            console.log(error);
                        }else{
                            console.log('Message sent: ' + info.response);
                        }
                    });
                     
                    };
                  });
                   res.redirect("/review/dashboard/success")   
                }
            });
            
         }
     });
 });
 
 

 
 
router.get("/review/success/all/view", isLoggedIn, isReview, function(req, res){
    Applicants.find({}, function(err, Applicant){
        if(err){
            console.log(err)
        }else{
            res.render("all", { Applicant: Applicant })
        }
    })
})
 
router.get("/review/success/open/view",isLoggedIn, isReview, function(req, res){
    Applicants.find({}, function(err, Applicant){
        if(err){
            console.log(err)
        }else{
            console.log("Applicants ===" + Applicant)
            var open = Applicant.filter(function(applicant){
                return(applicant.Review[0] === undefined)
            })
            console.log(open)
            res.render("open", { open: open })
        }
    })
})
 
 router.get("/review/success/approved/view", isLoggedIn, isReview, function(req, res){
    Applicants.find({}, function(err, Applicant){
        console.log("aa"+Applicant)
        console.log("ab "+Applicant[0].Review[0].stat)
        if(err){
            console.log(err)
        }else{
        var appr = Applicant.map(function(applicant){
                if(applicant.Review[0]===undefined){
                    return []
                }else{
                    return(applicant)
                }
            })
            var approved = appr.filter(function(appr){
                console.log(appr)
                return (appr.Review[0].stat==="Approved")
                
            })
           console.log(approved)
            res.render("accepted", { approved: approved })
        }  
    })
})

router.get("/review/success/rejected/view", isLoggedIn, isReview, function(req, res){
    Applicants.find({}, function(err, Applicant){
        if(err){
            console.log(err)
        }else{
            var rej = Applicant.map(function(applicant){
                if(applicant.Review[0]===undefined){
                    return []
                }else{
                    return(applicant)
                }
            })
            var rejected = rej.filter(function(rej){
                console.log(rej)
                return (rej.Review[0].stat==="Rejected")
                
            })
            console.log(rejected)
            
            res.render("rejected", { rejected: rejected })
        }
    })
})

function isLoggedIn(req, res, next){
    if(req.isAuthenticated("local")){
        return next();
    }
    res.redirect("/review/login");
}

function isReview(req, res, next){
    Review.findById(req.user.id, function(err, found){
        if(found){
            return next()
        }
        res.redirect("/review/login")
    })
}

module.exports = router