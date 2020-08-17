// main page routing goes here (i.e. home page, catalogue, etc.)

const express = require('express');
const router = express.Router();
const userRoute = require('./user');
const passport = require('passport');
const staffRoute = require('./staff');
const user = require('../models/User')
const ensureAuthenticated = require('../helpers/auth'); // to verify that a user is logged in
const staffAuth = require('../helpers/staffAuth'); // to verify that user logged in is a Staff
const Item = require('../models/Item');
const stockLevelCheck = require('../helpers/stockLevelCheck') // for catalogue to disable buying items that are out of stock
// const bootstrap = require('bootstrap')

router.get('/', (req, res) => {
    res.render('home')
});

router.get('/staff-login', (req, res) => {
    res.render('staff/login');
});

router.post('/staff-login', (req, res, next) => {
    passport.authenticate('local', {
        successRedirect: '/staff/update',
        failureRedirect: '/staff-login',
        failureFlash: true,
    }) (req, res, next);
});

router.get('/catalogue/his', (req, res) => {
    Item.findAll({
        where: {
            itemGender: "M",
            status: "Active"
        },raw: true
    })
        .then((item) => {
            res.render('catalogue', {
                item : item,
                title : "Men's",
                availSizes: "XS, S, M, L, XL, XXL"
        })
    })
    
});

router.get('/catalogue/hers', (req, res) => {
    Item.findAll({
        where: {
            itemGender: "F",
            status: "Active"
        },raw: true
    })
        .then((item) => {
            res.render('catalogue', {
                item : item,
                title : "Women's"
        })
    })
    
});

router.get('/view-details/:itemSerial', (req, res) => {
    let specificItem;
    let allItems;
    async function viewSpecificItem() {
        await Item.findOne({
            where: {
                itemSerial: req.params.itemSerial
            }, raw: true
        }).then((item) => {
                specificItem = item
        }).catch(err => console.log(err)); // To catch no item serial
        await Item.findAll({
            where: {
                status: "Active"
            }, raw: true
        }).then((item) => {
                allItems = item
            });
    }
    viewSpecificItem().then(() => {
        console.log(specificItem, allItems)
        res.render('view-details', {
            specificItem, //passes item that was chosen to handlebars
            allItems //passes all other items
        })
    })
    console.log(specificItem, allItems)

});

router.get('/error', (req, res) => {
    res.render('user/errorpage');
})

// router.use('/user', ensureAuthenticated, userRoute);
router.use('/user', userRoute);
router.use('/staff', ensureAuthenticated, staffAuth, staffRoute);

module.exports = router;