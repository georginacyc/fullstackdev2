// staff side routing goes here

const express = require('express');
const router = express.Router();

router.get('/home', (req, res) => {
    res.render('staff/staffhome')
});

module.exports = router;