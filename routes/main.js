// main page routing goes here (i.e. home page, catalogue, etc.)

const express = require('express');
const router = express.Router();
const userRoute = require('./user');
const passport = require('passport');
const staffRoute = require('./staff');
const ensureAuthenticated = require('../helpers/auth'); // to verify that a user is logged in
const staffAuth = require('../helpers/staffAuth'); // to verify that user logged in is a Staff
const Item = require('../models/Item');

router.get('/', (req, res) => {
    res.render('home')
});

router.get('/staff-login', (req, res) => {
    res.render('staff/login');
});

router.post('/staff-login', (req, res, next) => {
    passport.authenticate('local', {
        successRedirect: '/staff/home',
        failureRedirect: '/staffLogin',
        failureFlash: true,
    }) (req, res, next);
});

// router.use('/user', ensureAuthenticated, userRoute);
router.use('/user', userRoute);
router.use('/staff', ensureAuthenticated, staffAuth, staffRoute);

router.get('/catalogue', (req, res) => {
    Item.findAll({
        raw: true
    })
        .then((item) => {
            res.render('catalogue', {
                item : item,
        })
    })
    
});

router.get('/view/itemSerial', (req, res) => {
    Item.findOne({
        where: {
            itemSerial: req.params.itemSerial
        }, raw: true
    }).then((item) => {
        res.render('viewDetails', {
            item // passes the item object to handlebars

        });
    }).catch(err => console.log(err)); // To catch no item serial
});
module.exports = router;