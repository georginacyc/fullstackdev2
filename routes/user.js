// user related routing goes here (i.e. logging in, account details, etc.)
const express = require('express');
const router = express.Router();
const passport = require('passport');
const User = require('../models/User');
const alertMessage = require('../helpers/messenger');
const bcrypt = require('bcryptjs');


// routing goes in between !!!!

// Register User
router.get('/register', (req, res) => {
	res.render('user/register') // renders views/register.handlebars
});

router.post('/register', (req, res) => {
	let errors = [];
    // Retrieves fields from register page from request body
    let {type,fname,lname,gender,dob,hp,address, email, password, password2} = req.body;

    // Checks if both passwords entered are the same
    if(password !== password2) {
        errors.push({text: 'Passwords do not match'});
    }

    // Checks that password length is more than 4
    if(password.length < 4) {
        errors.push({text: 'Password must be at least 4 characters'});
    }

    if (errors.length > 0) {
        res.render('user/register', {
            errors,
            type,
            fname,
            lname,
            gender,
            dob,
            hp,
            address,
            email,
            password,
            password2
    });
    } else {
        // If all is well, checks if user is already registered
        User.findOne({ where: {email: req.body.email} })
            .then(user => {
                if (user) {
                // If user is found, that means email has already been
                    // registered
                res.render('user/register', {
                    error: user.email + ' already registered',
                    type,
                    fname,
                    lname,
                    gender,
                    dob,
                    hp,
                    address,
                    email,
                    password,
                    password2
                });
            } else {
        
        password = bcrypt.hashSync(password, 10);
        // Create new user record
        User.create({ type,fname,lname,gender,dob,hp,address, email, password })
            .then(user => {
            alertMessage(res, 'success', user.name + ' added.Please login', 'fas fa-sign-in-alt', true);
            res.redirect('/');
            })
            .catch(err => console.log(err));
            }
        });
        }
    });
    

// Login User
router.get('/login', (req, res) => {
	res.render('user/login') // renders views/login.handlebars
});


// Login Form POST => /user/login
router.post('/login', (req, res, next) => {
    passport.authenticate('local', {
    successRedirect: '/', 
    failureRedirect: '/user/login', 
    failureFlash: true,
    }) (req, res, next);
});

// User entering homepage after login
router.get('/', (req, res) =>{
    name = req.user.fname;
    if (user == "User") {
        res.render('/');
    } else{
        res.render('/');
    }
} );

// User Profile
router.get('/user/editUserAccount', (req,res)=>{
    req.user
})

// Logout User
router.get('/logout', (req, res) => {
	req.logout();
	res.redirect('/');
});

router.get('/accounts', (req, res) => {
    User.findAll({
        raw: true
    })
    .then((users) => {
        res.render('user/userAccounts', {
            accounts: users,
           
        });
    })
     //res.render('user/userAccount');
});
    



module.exports = router;