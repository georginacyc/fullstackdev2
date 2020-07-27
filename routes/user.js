// user related routing goes here (i.e. logging in, account details, etc.)
const express = require('express');
const router = express.Router();
const passport = require('passport');
const User = require('../models/User');
const alertMessage = require('../helpers/messenger');
const bcrypt = require('bcryptjs');
const Custorder = require('../models/CustOrders');
const CustOrders = require('../models/CustOrders');


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
router.get('/editUserAccount', (req,res)=>{
    User.findOne({
        where: {
            id: req.user.id
        }
    }).then((user) => {
        res.render('user/editUserAccount', {user});
    }) 
});

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
    
//user shopping cart
router.get('/cart', (req, res) => {
	res.render('user/cart') // renders views/cart.handlebars
});

//user checkout
router.get('/checkout', (req, res) => {
	res.render('user/checkout') // renders views/checkout.handlebars
});

// user orders
router.get('/orders', (req, res) => {
	res.render('user/orders') // renders views/checkout.handlebars
});

/*
router.get('/orders', (req, res) => {
    CustOrders.findAll()
    .then((custorder) => {
    // pass object to orders.handlebar
        res.render('user/orders', {
            orders : orders,});
    })
    .catch(err => console.log(err));
});
*/
router.post('/checkout', (req, res) => {
    let userId = 1001;
    let itemSerial = "2222TF";
    let quantity = 1;
    let status = "pending";
    let couponCode= "FIRST100";
    let total_Amt = 27.99;
    let order_Date = "2020-07-20";
    let ship_Date = null;
    let paid_Date = null;
    let completion_Date = null;

    CustOrders.create({
        userId,
        itemSerial,
        quantity,
        status,
        couponCode,
        total_Amt,
        order_Date, 
        ship_Date,
        paid_Date, 
        completion_Date
    }) 
    .then(custorder => {
        res.redirect('/user/orders');})
    .catch(err => console.log(err))

});

module.exports = router;