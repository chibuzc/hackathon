var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var methodOverride = require("method-override");
var merge = require('merge-objects');
var Applicants = require("./models/Applicants");
var Review = require("./models/Review");
var Processor = require("./models/Processor");
var dotenv = require("dotenv")
dotenv.load();
var passport = require("passport");
var LocalStrategy = require("passport-local");
var passportLocalMongoose = require("passport-local-mongoose");
var FacebookStrategy = require("passport-facebook").Strategy;
var nodemailer = require('nodemailer'); 
var xoauth2 = require("xoauth2");
var ApplicantsRoute = require("./routes/applicants")
var ReviewRoutes = require("./routes/reviews")
var ProcessorRoutes = require("./routes/processor")
const util = require('util')
var flash = require("connect-flash");
var fs = require("fs");
var S3FS = require("s3fs");
var multiparty = require ("connect-multiparty");
    multipartyMiddleware = multiparty();
    s3fsImpl = new S3FS("hackathonchibuz", {
        accessKeyId: process.env.s3fs_accessKeyId,
        secretAccessKey:process.env.s3fs_secretAccessKey
    });
mongoose.connect("mongodb://localhost/licenseApp")
app.use(require("express-session")({
    secret: process.env.express_session_secret,
    resave: false,
    saveUninitialized: false
}));
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended: true}));
app.use(methodOverride("_method"));
app.use(multipartyMiddleware)
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
app.use(function(req,res,next){
    res.locals.user = req.user;
    //res.locals.process = req.user.Process;
    res.locals.error = req.flash("error");
    res.locals.success = req.flash("success");
    next();
})

passport.use("review-local", new LocalStrategy( function(username, password, done) {
    Review.findOne({ username: username }, function(err, user) { 
        if(user){
            return done(null, user);
        }else{
            done(err);
        }
    });
}));
    // ...
passport.use("processor-local", new LocalStrategy( function(username, password, done) {
       Processor.findOne({ username: username}, function(err, user) {
    // ...
    if(user){
        return done(null, user);
       }else{
           done(err);
       }
    });
}));

passport.use(new FacebookStrategy({
    clientID: process.env.facebook_clientID,
    clientSecret: process.env.facebook_clientSecret,
    callbackURL: "http://localhost:8080/auth/facebook/callback",
    profileFields: ['id', 'displayName', 'photos', 'email']
},
function(accessToken, refreshToken, profile, cb){
    Applicants.findOne({ facebookId: profile.id }, function(err, registered){
        if (err){
            return cb(err)
        }
        if (!registered){
            var register = new Applicants({
                facebookId : profile.id,
            });
            console.log("new"+register)
            console.log(profile.id)
            console.log(register.review)
            register.save(function(err, saved){
                if(err){
                    console.log(err)
                }else{
                    var transport = nodemailer.createTransport({
                        service: 'gmail',
                        auth: {
                                user: process.env.gmail_user,
                                pass: process.env.gmail_pass
                        }
                    });
                    
                    var mailOptions = {
                        from: '<chalesbuzor@gmail.com>', // sender address
                        to: 'chibuzc@yahoo.co.uk', // list of receivers
                        subject: 'REGISTRATION LINK', // Subject line
                        text: "Follow the link to complete your registration. http://localhost:8080/"+ saved._id
                    };
                    
                    transport.sendMail(mailOptions, function(error, info){
                        if(error){
                            console.log(error);
                            return
                        }
                        console.log('Message sent: ' + info.response);
                        transporter.close()
                        
                    });
                    console.log("saved = "+ saved)

                }
            })
            return cb(err, register)
        }else{
            console.log("found" + registered)
            return cb(err, registered)
        }
    })
}
));

passport.serializeUser(function(user, done) {
  done(null, user.id);
});


passport.deserializeUser(function(id, done) {
  Review.findById(id, function(err, user) {
      if(err){
          done(err)
      }
      else if(user){
          done(null, user);
          
      }
    });
  Processor.findById(id, function(err, user) {
      if(err){
          done(err)
      }else if(user){
          done(null, user)
      }
    
  })
 
});

app.get('/auth/facebook',
  passport.authenticate('facebook'));

app.get('/auth/facebook/callback',
  passport.authenticate('facebook', { failureRedirect: '/' }),
  function(req, res) {
        res.render('profile', {Applicants: req.user});
  })
  

app.get("/", function(req, res){
    console.log(req.params)
    res.render("landingpage")
})

app.get("/review/list", function(req, res){
    res.render("reviewer");
})

app.get("/review/register", function(req, res){
    res.render("register");
});

app.post("/review/register", function(req, res){
    req.body.username;
    req.body.password;
    Review.register(new Review({username: req.body.username }),req.body.password,function(err, user){
        if(err){
            console.log(err)
        }
        passport.authenticate("review-local")(req, res, function(){
            res.redirect("/review/dashboard/success")
        })
    })
    
});

app.get("/review/login", function(req, res){
    res.render("login");
});

app.post("/review/login", passport.authenticate("review-local", {
    successRedirect: "/review/dashboard/success",
    failureRedirect: "/review/login"
}), function(req, res){
    
})

app.get("/logout", function(req, res){
    req.logout();
    res.redirect("/review/list")
})

app.get("/process/list", function(req, res){
    res.render("processSign");
})

app.get("/process/register", function(req, res){
    res.render("processRegister");
});

app.post("/process/register", function(req, res){
    req.body.username;
    req.body.password;
    req.body.role;
    Processor.register(new Processor({username: req.body.username, role:req.body.role }),req.body.password,function(err, user){
        if(err){
            console.log(err)
        }
        passport.authenticate("processor-local")(req, res, function(){
            res.redirect("/process/done/overview")
        })
    })
    
});

app.get("/process/login", function(req, res){
    res.render("processLogin");
});

app.post("/process/login", passport.authenticate("processor-local", {
    successRedirect: "/process/done/overview",
    failureRedirect: "/process/login"
}), function(req, res){
    
})

app.get("/process/logout", function(req, res){
    req.logout();
    req.flash("success", "logged out succesfully");
    res.redirect("/process/list")
})



app.use(ApplicantsRoute)
app.use(ReviewRoutes)
app.use(ProcessorRoutes)
 
app.listen("8080", function(){
    console.log('server is running')
})