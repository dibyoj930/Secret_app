//jshint esversion:6
 //require('dotenv').config();
 const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require('express-session');
const passport = require("passport");
const passportlocal = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');
//const bcrypt = require("bcrypt");
//const md5 = require("md5");
const app = express();
//const saltrounds = 10;

app.use(express.static("public")); 

app.set('view engine','ejs');

app.use(bodyParser.urlencoded({
    extended:true
}));

app.use(session({
    secret:"our little secret.",
    resave:false,
    saveUninitialized:false
}));

app.use(passport.initialize());
app.use(passport.session());

CLIENT_ID="527282072428-vej540mhv1iv0k3htfra5teg2n0osv1q.apps.googleusercontent.com";
CLIENT_SECRET="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";

mongoose.connect("mongodb+srv://Dibyo:123@cluster3.ejeplzg.mongodb.net/usersdb",{useNewUrlParser: true});

const userschema = new mongoose.Schema({
    email:String,
    password:String,
    googleid:String,
    secret:String
});

userschema.plugin(passportlocal);
userschema.plugin(findOrCreate);

const User = new mongoose.model("User",userschema);
passport.use(User.createStrategy());
passport.serializeUser(function(user, done) {
    done(null, user.id); 
   // where is this user.id going? Are we supposed to access this anywhere?
});

// used to deserialize the user
passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
        done(err, user);
    });
});

passport.use(new GoogleStrategy({
    clientID: CLIENT_ID,
    clientSecret: CLIENT_SECRET,
    callbackURL: "https://floating-everglades-91891.herokuapp.com/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
},
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile);
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

app.get("/",function(req,res){
    res.render("home");
});

app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile'] }));

app.get("/auth/google/secrets", 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/secrets');
 
});

app.get("/login",function(req,res){
    res.render("login");
});

app.get("/register",function(req,res){
    res.render("register");
});
app.get("/secrets",function(req,res){
    User.find({"secret":{$ne:null}}, function(err,found){
        if(err){
            console.log(err);
        }
        else{
            if(found){
                res.render("secrets",{userwithsecrets:found});
            }
        }
    });

});

app.post("/submit",function(req,res){
    const secretsubmitted = req.body.secret;
    User.findById(req.user.id,function(err,found){
    if(err){
        console.log(err);
    }
    else{
        if(found){
            found.secret = secretsubmitted;
            found.save(function(){
                res.redirect("/secrets");
            });
        }
    }
    });
});

app.get("/submit",function(req,res){
   if(req.isAuthenticated()){
    res.render("submit");
   }
   else{
    res.redirect("/login");
   }
});


app.get("/logout",function(req,res){
    req.logout(function(err) {
        if (err) { console.log(err); }
        res.redirect('/');
      });
});



//md5(req.body.password)



app.post("/register",function(req,res){

    User.register({username:req.body.username},req.body.password,function(err,user){
         if(err){
            console.log(err);
            res.redirect("/register");
         }else{
            passport.authenticate("local")(req,res,function(){
                res.redirect("/secrets");
            });
         }
    });
  
    
});
//md5(req.body.password);
app.post("/login",function(req,res){
   
    const user = new User({
        username:req.body.username,
        password:req.body.password
    });

    req.login(user,function(err){
        if(err){
            console.log(err);
        }
        else{
            passport.authenticate("local")(req,res,function(){
                res.redirect("/secrets");
            });
        }
    });
        


});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}
app.listen(port);
app.listen(3000, function() {
  console.log("Server started on port 3000 successfully!!!");
});