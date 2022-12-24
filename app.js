const express = require('express');
const mongoose = require('mongoose');
const ejs = require('ejs');
const bodyParser = require('body-parser');
const session = require('express-session'); //for cookie session
const passportLocalMongoose = require('passport-local-mongoose');
const passport = require('passport');
// const { use } = require('passport');
// const { request } = require('express');

// initialize an express app
const app = express();

// setup the app to use ejs to render views
app.set('view engine', 'ejs');

app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(express.static("public"));

// create session
app.use(session({
    secret: "mylittlepasswordstring",
    resave: false,
    saveUninitialized: false
}));

// initialize and use passport session
app.use(passport.initialize());
app.use(passport.session());

// connect to DB using mongoose middleware
mongoose.set('strictQuery', false);
mongoose.connect('mongodb://localhost:27017/jokesDB');

//create usershema & model
const userSchema = new mongoose.Schema({
    username: String,
    password: String
});

//create jokeSchema & model
const jokeSchema = new mongoose.Schema({
    user: String,
    title: String,
    body: String,
    date: { type: Date, default: Date.now },
    meta: {
        votes: Number,
        favs:  Number
      }
});



userSchema.plugin(passportLocalMongoose);
jokeSchema.plugin(passportLocalMongoose);

const User = new mongoose.model('User', userSchema);
const Joke = new mongoose.model('Joke', jokeSchema);

passport.use(User.createStrategy());

// using passport global se/de-rialization
passport.serializeUser(function(user, cb) {
    process.nextTick(function() {
      cb(null, { id: user.id, username: user.username });
    });
  });
  
passport.deserializeUser(function(user, cb) {
    process.nextTick(function() {
      return cb(null, user);
    });
  });




// renders home
app.get('/', function(req, res){
    res.render('home');
});

// renders jokes page
app.get('/jokes', function(req, res){
    res.render('jokes');
});

// renders login page
app.get('/login', function(req, res){
    res.render('login');
});

// renders register page
app.get('/register', function(req, res){
    res.render('register');
});

app.get('/submit', function(req, res){
    if(req.isAuthenticated()){
        res.render('submit');
    } else {
        res.redirect('/login')
    }  
});

app.post('/submit', function(req, res){
    const submittedJoke = new Joke({
        user: req.body.id,
        title: req.body.jokeTitle,
        body: req.body.jokeBody
    });

    submittedJoke.save(function(){
        res.redirect('/jokes');
    });


});


//register route
app.post('/register', function(req, res){
    // use passport-local-mongoose to register users and authenticate them
    User.register({username: req.body.username}, req.body.password, function(err, user){
        if (err){
            res.redirect('/register')
            console.log(err);
        } else {
            console.log(req.body.password);
            passport.authenticate('local')(req, res, function(){
                res.redirect('/jokes');
                console.log(req.body.password);
            });
        }
    });
});

//login route using the passport-local-mongoose to authenticate users
app.post('/login', function(req, res){
    const user = new User({
        username: req.body.username,
        password: req.body.password
    });
    
    req.login(user, function(err){
        if(err){
            console.log(err);
            res.redirect('/login');
        }else {
            passport.authenticate('local')(req, res, function(){
                res.redirect('/jokes');
            });
        }
    });
});


app.listen(3000, function(){
    console.log('Server started successfuly on port 3000');
});