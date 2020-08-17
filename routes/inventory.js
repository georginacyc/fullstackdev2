// inventory routes go here


const express = require('express');
const router = express.Router();
const staffMain = "../layouts/staff";
const Item = require('../models/Item');
const moment = require('moment');
const StockOrder = require('../models/StockOrder');
const sequelize = require('sequelize');
const { DATEONLY } = require('sequelize');



router.get('/', (req, res) => {
    Item.findAll({
        raw: true
    })
        .then((item) => {
            res.render('staff/inventory', {
                item: item,
                layout: staffMain
            })
        })
});

//Stock Order Routes

router.get('/stock/view-orders', (req, res) => {
    StockOrder.findAll({
        raw: true
    }).then((stockorder) => {
        res.render('staff/stockOrders', {
            stockorder,
            layout: staffMain
        })
    })
});

router.get('/stock/order/:itemSerial', (req, res) => {
    Item.findOne({
        where: {
            itemSerial: req.params.itemSerial
        }, raw: true
    }).then((item) => {
        // calls views/staff/editItem.handlebar to render the edit item

        res.render('staff/createStockOrder', {
            layout: staffMain,
            item // passes the item object to handlebars
        });
    }).catch(err => console.log(err)); // To catch no item serial
});


router.post('/stock/order/:itemSerial', (req, res) => {

    //Adds new item
    let stockorderDate = new DATEONLY();
    let shipmentStatus = req.body.shipmentStatus;
    let shipmentDate = moment(req.body.shipmentDate, 'YYYY-MM-DD');
    let itemSerial = req.params.itemSerial;
    let stockorderQuantity = req.body.stockorderQuantity;
    let receivedDate = undefined;
    console.log(itemSerial);

    StockOrder.create({
        stockorderDate,
        shipmentStatus,
        shipmentDate,
        itemSerial,
        stockorderQuantity,
        receivedDate
    }).then(stockorder => {
        res.redirect('/staff/inventory/stock/view-orders');
    }).catch((err) => {
        console.log(err)
        res.redirect('/staff/error')
    });
});

router.get('/stock/receive/:id', (req, res) => {
    let receivedDate = moment().format('YYYY-MM-DD');
    StockOrder.findOne({
        where: {
            id: req.params.id
        }, raw: true,
    }).then((stockorder) => {
        console.log(stockorder),
            res.render('staff/receiveOrder', {
                layout: staffMain,
                stockorder, receivedDate // passes the item object to handlebars

            });
    }).catch(err => res.render('staff/errorpage')); // To catch no item serial
});

router.put('/stock/save-recieve/:id', (req, res) => {
    let receivedDate = moment().format('YYYY-MM-DD');

    StockOrder.findOne({
        where: {
            id: req.params.id
        }, raw: true
    }).then((stockorder) => {
        // variables to be updated
        // only select variables can be edited
        var stockorderQuantity = stockorder.stockorderQuantity
        var itemSerial = stockorder.itemSerial
        // find item to be updated
        Item.findOne({
            where: {
                itemSerial: stockorder.itemSerial
            }, raw: true
        }).then((item) => {
            // set new stock level
            var newStockLevel = item.stockLevel += stockorderQuantity;
            Item.update({
                stockLevel: newStockLevel
            }, {
                where: {
                    itemSerial: itemSerial
                }
            }).then(
                StockOrder.update({
                    shipmentStatus: "Received",
                    receivedDate: receivedDate
                }, {
                    where: {
                        id: req.params.id
                    }
                }))
        })
        // redirects back to the main item page
        res.redirect('/staff/inventory/stock/view-orders');
    }).catch(err => res.render('staff/errorpage')); // To catch no item serial
});


module.exports = router;