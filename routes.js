const express=require('express');
const routes=express.Router();
const mongoose=require('mongoose');
const bodyparser=require('body-parser');
const bcrypt=require('bcryptjs');
const user=require('./model.js');
const passport=require('passport');
const session=require('express-session');
const cookieParser=require('cookie-parser');
const flash = require('connect-flash');
const request=require('request');
const cheerio=require('cheerio');
const rp = require('request-promise');
const validUrl = require('valid-url');
const urlExist=require('url-exist');
const http = require('http');
const Promise=require('promise');
const got = require('got');


routes.use(bodyparser.urlencoded({ extended: true }));
routes.use(cookieParser('secret'));
routes.use(session({
    secret: 'secret',
    maxAge: 3600000,
    resave: true,
    saveUninitialized: true,
}));

routes.use(passport.initialize());
routes.use(passport.session());
routes.use(flash());

routes.use(function (req, res, next) {
    res.locals.success_message = req.flash('success_message');
    res.locals.error_message = req.flash('error_message');
    res.locals.error = req.flash('error');
    next();
});

const checkAuthenticated = function (req, res, next) {
    if (req.isAuthenticated()) {
        res.set('Cache-Control', 'no-cache, private, no-store, must-revalidate, post-check=0, pre-check=0');
        return next();
    } else {
        res.redirect('/');
    }
}


mongoose.connect('mongodb+srv://sameer:sameer@cluster0.fbu90.mongodb.net/sameer?retryWrites=true&w=majority',{
    useNewUrlParser:true,
    useUnifiedTopology:true
}).then(()=>console.log('Database connected'));

passport.serializeUser(function (user, cb) {
    cb(null, user.id);
});

passport.deserializeUser(function (id, cb) {
    user.findById(id, function (err, user) {
        cb(err, user);
    });
});

var localStrategy = require('passport-local').Strategy;
passport.use(new localStrategy({ usernameField: 'username' }, (username, password, done) => {
    user.findOne({ username: username }, (err, data) => {
        if (err) throw err;
        if (!data) {
            return done(null, false, { message: "User Doesn't Exists.." });
        }
        bcrypt.compare(password, data.password, (err, match) => {
            if (err) {
                return done(null, false);
            }
            if (!match) {
                return done(null, false, { message: "Password Doesn't Match" });
            }
            if (match) {
                return done(null, data);
            }
        });
    });
}));

routes.get('/',(req,res)=>{
    res.render('index',{'element':''}); 
})


routes.post('/register', (req, res) => {
    var { username, password } = req.body;
    var err;
    if (!username || !password) {
        err = "Please Fill All The Fields...";
        res.render('index', { 'err2': err });
    }
    if (typeof err == 'undefined') {
        user.findOne({ username: username }, function (err, data) {
            if (err) throw err;
            if (data) {
                console.log("User Exists");
                err = "User Already Exists ";
                res.render('index', { 'err2': err});
            } else {
                bcrypt.genSalt(10, (err, salt) => {
                    if (err) throw err;
                    bcrypt.hash(password, salt, (err, hash) => {
                        if (err) throw err;
                        password = hash;
                        user({
                            username,
                            password,
                        }).save((err, data) => {
                            if (err) throw err;
                            req.flash('success_message', "Registered Successfully.. Login To Continue..");
                            res.redirect('/');
                        });
                    });
                });
            }
        });
    }
});
      
routes.get('/login', (req, res) => {
    res.render('index');
});

routes.post('/login', (req, res, next) => {
    var{username,password}=req.body;
    if(!username||!password){
        res.render('index',{'err1':'Please Fill All The Fields...'});
        next();
    }
    passport.authenticate('local', {
        failureRedirect: '/login',
        successRedirect: '/success',
        failureFlash: true,
    })(req, res, next);
    
}); 

routes.get('/success', checkAuthenticated, (req, res) => {
    res.render('success', { 'user': req.user,'err':'' });
});

routes.get('/logout', (req, res) => {
    req.logout();
    res.redirect('/login');
});


routes.get('/addmsg',(req,res)=>{
    res.render('content',{'message':'','url':''});
})


routes.post('/addmsg', checkAuthenticated, (req, res) => {
    var{urls}=req.body;
    if(!urls){
        res.render('success',{'user':req.user,'err':"Url can't be blank"})
    }
    const $ = require('cheerio');
    const url = req.body['urls'];

    (async () => {
        try {
            const response = await got(url);
        } catch (error) {
        res.render('success',{'user':req.user,'err':"Invalid Url"});
        }
    })();

    user.findOneAndUpdate(
        { username: req.user.username },
        {
            $push: {
                urls: req.body['urls'],
            }
        }, (err, suc) => {
            if (err) throw err;
            if (suc) console.log("Added Successfully...");
        }
    );

    rp(url)
    .then(function(html){
        const $=cheerio.load(html);

        const site=$('*').text();
        user.findOneAndUpdate(
            { username: req.user.username },
            {
                $push: {
                    messages: site,
                }
            }, (err, suc) => {
                if (err) throw err;
                if (suc) console.log("Added Successfully...");
            }
        );
     })
    .catch(function(err){
        throw err;
    });
    

    rp(url)
    .then(function(html){
        const $=cheerio.load(html);
        const new_site=$('*').text();
        res.render('content',{'message':new_site,'url':url});
     })
    .catch(function(err){
        throw err;
    });

}); 

module.exports=routes;