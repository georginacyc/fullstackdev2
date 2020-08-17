// routing for item pages

const express = require('express');
const router = express.Router();
const staffMain = "../layouts/staff";
const Item = require('../models/Item');
const sequelize = require('sequelize');

//generate random Serial
function generateSerial() {
    'use strict';
    var chars = '1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
        serialLength = 10,
        randomSerial = "",
        i,
        randomNumber;

    for (i = 0; i < serialLength; i = i + 1) {
        randomNumber = Math.floor(Math.random() * chars.length);
        randomSerial += chars.substring(randomNumber, randomNumber + 1);
    }
    return randomSerial
}

router.get('/view-all', (req, res) => {
    Item.findAll({
        raw: true
    })
        .then((item) => {
            res.render('staff/itempage', {
                item: item,
                layout: staffMain
            })
        })

});

router.get('/create', (req, res) => {
    res.render('staff/createItem', { layout: staffMain })
});

router.post('/create', (req, res) => {
    let errors = [];

    // form data and variables
    let itemName = req.body.itemName;
    let itemCategory = req.body.itemCategory === undefined ? '' : req.body.itemCategory.toString();
    let itemGender = req.body.itemGender === undefined ? '' : req.body.itemGender.toString();
    let prefix = generateSerial();
    let itemSerial = prefix + itemCategory.slice(0, 1) + itemGender;
    let itemCost = req.body.itemCost;
    let itemPrice = req.body.itemPrice;
    let itemDescription = req.body.itemDescription;
    let stockLevel = 0;
    let status = "Active"
    // check for errors if not will add to db
    if (errors.length > 0) {
        res.render("/staff/createItem", {
            errors, itemName, itemCategory, itemGender, itemCost, itemPrice, itemDescription, stockLevel, status, layout: staffMain
        });
    } else {
        Item.create({
            itemName,
            itemSerial,
            itemCategory,
            itemGender,
            itemCost,
            itemPrice,
            itemDescription,
            stockLevel,
            status
        }).then(item => {
            res.redirect('/staff/item/view-all');
        }).catch(err => res.render('/staff/errorpage', { errors }));
    }
});

router.get('/edit/:itemSerial', (req, res) => {
    Item.findOne({
        where: {
            itemSerial: req.params.itemSerial
        }, raw: true
    }).then((item) => {
        // calls views/staff/editItem.handlebar to render the edit item

        res.render('staff/editItem', {
            layout: staffMain,
            item // passes the item object to handlebars

        });
    }).catch(err => console.log(err)); // To catch no item serial
});

router.put('/save-edited/:itemSerial', (req, res) => {
    let { itemCost, itemPrice, itemDescription } = req.body
    Item.findOne({
        where: {
            itemSerial: req.params.itemSerial
        }, raw: true
    }).then((item) => {
        // variables to be updated
        // only select variables can be edited
        Item.update({
            itemCost: itemCost,
            itemPrice: itemPrice,
            itemDescription: itemDescription
        }, {
            where: {
                itemSerial: req.params.itemSerial
            }
        })
        // redirects back to the main item page
        res.redirect('/staff/item/view-all');
    }).catch(err => console.log(err)); // To catch no item serial
});

// discontinue item
router.get('/discontinue/:itemSerial', (req, res) => {
    Item.findOne({
        where: {
            itemSerial: req.params.itemSerial
        }, raw: true
    }).then((item) => {
        // calls views/staff/editItem.handlebar to render the edit item

        res.render('staff/discontinueItem', {
            layout: staffMain,
            item // passes the item object to handlebars

        });
    }).catch(err => console.log(err)); // To catch no item serial
});


router.put('/save-discontinue/:itemSerial', (req, res) => {
    Item.findOne({
        where: {
            itemSerial: req.params.itemSerial
        }, raw: true
    }).then((item) => {
        // variables to be updated
        // only select variables can be edited
        Item.update({
            status: "Discontinued"
        }, {
            where: {
                itemSerial: req.params.itemSerial
            }
        })
        // redirects back to the main item page
        res.redirect('/staff/item/view-all');
    }).catch(err => console.log(err)); // To catch no item serial
});

//error page
router.get('/error', (req, res) => {
    res.render('staff/errorpage', {
        layout: staffMain
    })
});

module.exports = router;