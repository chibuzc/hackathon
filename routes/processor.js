var express = require("express");
var router = express.Router();
var Applicants = require("../models/Applicants");
var Process = require("../models/Processor");
var passport = require("passport");
var LocalStrategy = require("passport-local");

//list of all Unprocessed applications
router.get("/process/done/open", isLoggedIn, isProcess, function(req, res){
    Applicants.find({}, function(err, Applicant){
        if(err){
            console.log(err);
        }else{
        var appr = Applicant.map(function(applicant){
                if(applicant.Review[0]===undefined){
                    return [];
                }else{
                    return(applicant);
                }
            });
            var approved = appr.filter(function(appr){
                return (appr.Review[0].stat==="Approved");
            });
            var process = approved.filter(function(process){
                return (process.Process[0] === undefined);
            } );

            res.render("processOpen", { process: process });
        }
    });
});

//processor dashboard
router.get("/process/done/overview",isLoggedIn, isProcess, function(req, res){
    Applicants.find({}, function(err, Applicant){
       if(err){
            console.log(err);
        }else{
            console.log(req.session)
            console.log(req.user)
        var tot = Applicant.map(function(applicant){
                if(applicant.Review[0]===undefined){
                    return [];
                }else{
                    return(applicant);
                }
            });
            console.log(tot)
            console.log(tot[0].Review)
            var total = tot.filter(function(Tot){
                return (Tot.Review[0].stat==="Approved");
            });
            var totalProcess = total.filter(function(process){
                return (process.Process[0] === undefined);
            } );
            
            
            var appr = Applicant.map(function(applicant){
                if(applicant.Review[0]===undefined){
                    return [];
                }else{
                    return(applicant);
                }
            });
            var approved = appr.filter(function(appr){
                return (appr.Review[0].stat==="Approved");
            });
            var processorApproved = approved.filter(function(App){
                if(App.Process[0] !== undefined){
                    return (App.Process[0].finalStat === "Approved");
                }
            });

             var rej = Applicant.map(function(applicant){
                if(applicant.Review[0]===undefined){
                    return [];
                }else{
                    return(applicant);
                }
            });
            var rejected = rej.filter(function(rej){
                return (rej.Review[0].stat==="Approved");
            })
            var processorRejected = rejected.filter(function(App){
                if(App.Process[0] !== undefined){
                   return (App.Process[0].finalStat === "Rejected");
                }
            })
            
            res.render("processDashboard", {Applicant: total, open: totalProcess, approved: processorApproved, rejected: processorRejected})
        }
    });
});


router.get("/process/:id",isLoggedIn, isProcess, function(req, res){
    Applicants.findById(req.params.id, function(err, Applicants){
        if(err){
            console.log(err);
        }else{
            res.render("process", {Applicants:Applicants});
        }
    });
});


//process a particular application
router.post("/process/:id/done", isLoggedIn, isProcess, function(req, res){
     Applicants.findById(req.params.id,function(err, Applicants){
        if(err){
            console.log(err);
        }else{
            Process.create(req.body.Process, function(err, Process){
                if(err){
                    console.log(err);
                }else{
                     Applicants.Process=Process;
                    Applicants.save(function(err, saved){
                        if(err){
                    console.log(err);
                }else{
                    console.log("app" + saved);
                    if(saved.Process.finalStat==="Rejected"){
                        console.log("rej " + Applicants.Process.finalStat)
                    }
                }
                    });
                     
                }
                res.redirect("/process/done/overview")
            });
            
         }
     });
    
});

//list of approved process
router.get("/process/done/approved", isLoggedIn, isProcess, function(req, res){
    Applicants.find({}, function(err, Applicant){
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
                return (appr.Review[0].stat==="Approved")
            })
            var processorApproved = approved.filter(function(App){
                if(App.Process[0] !== undefined){
                    // return []
                    console.log("APP "+App.Process[0])
                    return (App.Process[0].finalStat === "Approved")
                }
            })
            res.render("processApproved", {approved:processorApproved} )
            
    }
    })
})

//list of rejected process
router.get("/process/done/rejected", isLoggedIn, isProcess, function(req, res){
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
                return (rej.Review[0].stat==="Approved")
            })
            var processorRejected = rejected.filter(function(App){
                if(App.Process[0] !== undefined){
                    // return []
                    console.log("APP "+App.Process[0])
                    return (App.Process[0].finalStat === "Rejected")
                }
            })
            res.render("processRejected", {rejected:processorRejected})
        }
    })
})

//list of all applications for processing
router.get("/process/done/all", isLoggedIn, isProcess, function(req, res){
    Applicants.find({}, function(err, Applicant){
        console.log("aa"+Applicant)
        console.log("ab "+Applicant[0].Review[0].stat)
        if(err){
            console.log(err)
        }else{
        var tot = Applicant.map(function(applicant){
                if(applicant.Review[0]===undefined){
                    return []
                }else{
                    return(applicant)
                }
            })
            res.render("processTotal", {process : tot})
        }
    })
})




function isLoggedIn(req, res, next){
            if(req.isAuthenticated("processor-local")){
                console.log("ok 2")
                return next()
            }
    req.flash("error", "please login first")
    res.redirect("/process/login");
}

function isProcess(req, res, next){
    Process.findById(req.user.id, function(err, found){
        if(found){
            return next()
        }
        res.flash("error", err.message)
        res.redirect("/process/login")
    })
}

module.exports = router