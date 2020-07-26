// main page routing goes here (i.e. home page, catalogue, etc.)

const express = require('express');
const router = express.Router();
const userRoute = require('./user');
const staffRoute = require('./staff');
const ensureAuthenticated = require('../helpers/auth'); // to verify that a user is logged in
const staffAuth = require('../helpers/staffAuth'); // to verify that user logged in is a Staff

router.get('/', (req, res) => {
    res.render('home')
});

// router.use('/user', ensureAuthenticated, userRoute);
router.use('/user', userRoute);
router.use('/staff', ensureAuthenticated, staffAuth, staffRoute);

module.exports = router;