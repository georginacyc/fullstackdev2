// staff side routing goes here

const express = require('express');
const router = express.Router();

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

router.get('/yourAccount', (req, res) => {
    res.render('staff/accountDetails')
});

router.get('/manageAccount', (req, res) => {
    res.render('staff/updateAccount')
});

module.exports = router;