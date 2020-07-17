// main page routing goes here (i.e. home page, catalogue, etc.)

const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    res.render('home')
});

router.get('/catalogue', (req, res) => {
    let errors = [];
    let {itemName, itemCategory, itemGender, itemPrice, itemDescription} = req.body;
    res.render('catalogue')
});

module.exports = router;