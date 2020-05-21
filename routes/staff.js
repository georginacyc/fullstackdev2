// staff side routing goes here

const express = require('express');
const router = express.Router();
const Staff = require('../models/Staff');
const alertMessage = require('../helpers/messenger');
const bcrypt = require('bcryptjs');
const db = require('../config/db');

router.get('/home', (req, res) => {
    res.render('staff/staffhome')
});

router.get('/accounts', (req, res) => {
    res.render('staff/accountList')
});

router.get('/createAnnouncement', (req, res) => {
    res.render('staff/createAnnouncements')
});

router.get('/createStaffAccount', (req, res) => {
    res.render('staff/createStaff')
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
        // SELECT * FROM monoqlo.staffs WHERE type="Staff"
        var sql = 'SELECT COUNT(*) FROM staffs';
        db.query(sql, function(error, results, fields) {
            if (error) throw error;
            console.log(results)
        });
        console.log("aaa");
        res.render('staff/createStaff');
        
        // password = bcrypt.hashSync(password, 10);
        
        // Staff.create({type, fname, lname, gender, dob, hp, address, password})
        // .then(staff => {
        //     res.redirect('/staff/accounts');
        //     alertMessage(res, 'success', staff.name + ' added. Please login.', 'fas fa-sign-in-alt', true);
        // })
        // .catch(err => console.log(err));
    }
});

router.get('/yourAccount', (req, res) => {
    res.render('staff/accountDetails')
});

router.get('/manageAccount', (req, res) => {
    res.render('staff/updateAccount')
});

module.exports = router;