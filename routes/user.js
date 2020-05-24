// user related routing goes here (i.e. logging in, account details, etc.)
const express = require('express');
const router = express.Router();
const passport = require('passport');

// routing goes in between !!!!

// Register User
router.get('/showlogin', (req, res) => {
	const title = 'Video Jotter';
	res.render('User/login') // renders views/login.handlebars
});

module.exports = router;