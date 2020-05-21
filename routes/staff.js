// staff side routing goes here

const express = require('express');
const router = express.Router();
const Staff = require('../models/Staff');
const alertMessage = require('../helpers/messenger');
const bcrypt = require('bcryptjs');
const mysql = require('mysql');
const dbCheck = require('../config/dbTableCheck');
const passport = require('passport')
let num = "000001";
console.log("1", num);

let domain = "@monoqlo.com";

var con = mysql.createConnection({
    host: "localhost",
    user: "monoqlo",
    password: "monoqlo",
    database: "monoqlo"
});

router.get('/login', (req, res) => {
    res.render('staff/login');
});

router.post('/login', (req, res, next) => {
    passport.authenticate('local', {
        successRedirect: '/staff/home',
        failureRedirect: '/staff/login',
        failureFlash: true,
    }) (req, res, next);
});

router.get('/logout', (req, res) => {
    req.logout();
    res.redirect('/');
});

router.get('/home', (req, res) => {
    res.render('staff/staffhome');
});

router.get('/accounts', (req, res) => {
    Staff.findAll()
    .then((staffs) => {
        res.render('staff/accountList', {
            accounts: staffs
        });
    })
    // res.render('staff/accountList');
});

router.get('/createAnnouncement', (req, res) => {
    res.render('staff/createAnnouncements');
});

router.get('/createStaffAccount', (req, res) => {
    res.render('staff/createStaff');
});

router.post('/createStaffAccount', (req, res) => {
    let errors = [];

    let {type, fname, lname, gender, dob, hp, address, password, pw2} = req.body;
    
    if (password !== pw2) {
        errors.push({text: 'Password must match'});
    }

    if  (password.length < 8 || pw2.length < 8 ) {
        errors.push({text: 'Password must be at least 8 characters'});
    }

    if (errors.length > 0) {
        res.render('staff/createStaff', {
            errors,
            type,
            fname,
            lname,
            gender,
            dob,
            hp,
            address,
            password,
            pw2
        });
    } else {
        console.log("4", num);
        password = bcrypt.hashSync(password, 10);

        console.log("fcheck1");
        console.log("fcheck2");
        console.log("fcheck3");
        con.query("SELECT COUNT(*) AS tableCheck FROM information_schema.tables WHERE table_schema = 'monoqlo' AND table_name = 'staffs'", function(err, result, fields) {
            
            let email = ""
            
            console.log("fcheck4");
            if (err) throw err;
            console.log(result);
            console.log("fchec5");
            console.log(result[0].tableCheck);
            if (result[0].tableCheck > 0) {
                console.log("fcheck6");
                console.log(result[0].tableCheck)
                con.query("SELECT COUNT(type) AS count FROM staffs", function(err, result, fields) {
                if (err) throw err;
                num = result[0].count + 1;
                num = num.toString();
                num = num.padStart(6, "0");
                console.log("2a", num);
                email = num.toString() + domain;
                Staff.create({type, email, fname, lname, gender, dob, hp, address, password})
                .then(staff => {
                    res.redirect('/staff/accounts');
                    alertMessage(res, 'success', staff.name + ' added. Please login.', 'fas fa-sign-in-alt', true);
                })
                .catch(err => console.log(err));
                });
            } else {
                num = "000001";
                console.log("fcheck7");
                console.log("2b", num);
                email = num.toString() + domain;
                console.log(num);
                Staff.create({type, email, fname, lname, gender, dob, hp, address, password})
                .then(staff => {
                    res.redirect('/staff/accounts');
                    alertMessage(res, 'success', staff.name + ' added. Please login.', 'fas fa-sign-in-alt', true);
                })
                .catch(err => console.log(err));
            };
            console.log("fcheck8");
        });
        console.log("fcheck9");
        console.log("fcheck10");
    };
});


router.get('/yourAccount', (req, res) => {
    res.render('staff/accountDetails')
});

router.get('/manageAccount', (req, res) => {
    res.render('staff/updateAccount')
});

module.exports = router;