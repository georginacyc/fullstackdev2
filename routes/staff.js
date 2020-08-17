// staff side routing goes here

const express = require('express');
const router = express.Router();
const User = require('../models/User');
const sNotif = require('../models/StaffNotifs');
const alertMessage = require('../helpers/messenger');
const bcrypt = require('bcryptjs');
const staffMain = "../layouts/staff";
const Item = require('../models/Item');
const moment = require('moment');
const StockOrder = require('../models/StockOrder');
const adminAuth = require('../helpers/adminAuth'); // to verify that user logged in is an Admin
const adminRoute = require('../routes/admin');
const pdf = require('pdf-creator-node');
const fs = require('fs');
const sequelize = require('sequelize');
const Op = sequelize.Op;
const CustOrders = require('../models/CustOrders');
const { DATEONLY } = require('sequelize');

//var Handlebars = require("handlebars");
// var MomentHandler = require("handlebars.moment");
// MomentHandler.registerHelpers(Handlebars);

    

router.get('/logout', (req, res) => {
    req.logout();
    res.redirect('/');
});

router.get('/update', (req, res) => { // updates last login for staff/admin account
    date = new Date();
    now = ("0" + date.getDate()).slice(-2) + '/' + ("0" + (date.getMonth() + 1)).slice(-2) + '/' + date.getFullYear() + " " + date.getHours()+ ":" + date.getMinutes() // format: DD/MM/YYYY HH:MM
    User.update({
        lastLogin: now
    }, {
        where: {
            id: req.user.id
        }
    }).then(() => {
        res.redirect('/staff/home');
    }).catch(err => console.log(err));
})

router.get('/home', (req, res) => { // everything below is retrieving data for charts in home page
    let pendingShipments;
    let thisMonthSales;
    let OOSitems;
    let genderData = [];
    let ageData = [];
    let categoryData = [];

    let date = new Date();
    let currMonth = date.getMonth() + 1;
    let currYear = date.getFullYear();
    let currDate = currYear.toString() + "-" + ("0" + currMonth.toString()).slice(-2) + "-" + "01"; // getting dates for calculating this months sales
    let nextDate = currYear.toString() + "-" + ("0" + currMonth.toString()).slice(-2) + "-" + "01";

    async function charts() {
        await CustOrders.count({ // counts no. of pending shipments
            where: {
                ship_Date: null
            }
        }).then((num) => {
            pendingShipments = num;
        }).catch(err => console.log(err));
        await CustOrders.count({ // count to retrieve data for this months sales
            where: {
                order_Date: {
                    [Op.gte]: currDate,
                    [Op.lt]: nextDate
                }
            }
        }).then((num) => { // counts no. of out of stock items
            thisMonthSales = num;
        }).catch(err => console.log(err));
        await Item.count({
            where: {
                'stockLevel': 0
            }
        }).then((num) => {
            OOSitems = num;
        }).catch(err => console.log(err));
        await User.count({ // counts no. of female customers
            where: {
                type: 'User',
                gender: 'Female'
            }
        }).then((num) => {
            genderData.push(num)
        }).catch(err => console.log(err));
        await User.count({ // counts no. of male customers
            where: {
                type: 'User',
                gender: 'Male'
            }
        }).then((num) => {
            genderData.push(num);
        }).catch(err => console.log(err));
        await User.findAll({ // retrieves all dob of registered customers
            where: {
                type: 'User'
            },
            attributes: ['dob'],
            raw: true
        }).then((result) => {
            let p = {'18-29': 0, '30-39': 0, '40-49': 0, '50-59': 0, '60<': 0} // dictionary to hold quantity of each age group
            for (i=0; i<result.length; i++) {
                str = result[i]['dob'].slice(0,5); // retrieving year from dob
                age = parseInt(currYear) - parseInt(str); // getting age
                if (age >= 18 && age <= 29) {
                    p['18-29'] += 1;
                } else if (age >= 30 && age <= 39) {
                    p['30-39'] += 1;
                } else if (age >= 40 && age <= 49) {
                    p['40-49'] += 1;
                } else if (age >= 50 && age <= 59) {
                    p['50-59'] += 1;
                } else if (age >= 60) {
                    p['60<'] += 1;
                }
            }
            for (var key in p) {
                ageData.push(p[key]); // passing in data for chartjs
            }
        }).catch(err => console.log(err));
        await Item.count({ // retrieve no. of tops
            where: {
                itemCategory: 'Top'
            }
        }).then((num) => {
            categoryData.push(num);
        }).catch(err => console.log(err));
        await Item.count({ // retrieve no. of bottoms
            where: {
                itemCategory: 'Bottom'
            }
        }).then((num) => {
            categoryData.push(num);
        }).catch(err => console.log(err));
    }
    charts().then(() => {
        res.render('staff/staffhome', {layout: staffMain, pendingShipments, thisMonthSales, OOSitems, genderData, ageData, categoryData});
    }).catch(err => console.log(err))
});

router.get('/announcements', (req, res) => {
    res.render('staff/allAnnouncements', {layout: staffMain});
});

router.get('/announcements-data', announcementsData);

// retrieves all announcements
async function announcementsData(req, res) {
    var sortBy = 'data';
    var order = 'desc';
    var offset = 0;
    var limit = 25;

    try {
		sortBy = (req.query.sort)?   req.query.sort   : sortBy;
		order  = (req.query.order)?  req.query.order  : order;
		offset = (req.query.offset)? parseInt(req.query.offset, 10) : offset;
		limit  = (req.query.limit)?  parseInt(req.query.limit, 10)  : limit;
	
	}
	catch(error) {
		console.error("Malformed Get request:");
		console.error(req.query);
		console.error(error);
		return res.status(400);
    }

    try {
        const total = await sNotif.count();
        const annList = await sNotif.findAll({
            offset: offset,
            limit: limit,
            order: [
                [sortBy, order.toUpperCase()]
            ]
        }).map((it) => {
            console.log(it.uuid);
            return it.toJSON();
        });
        return res.status(200).json({
            "total": total,
            "rows": annList
        });
    }
    catch (error) {
        console.log("Announcement Listing Error");
        res.redirect('/staff/error');
    }
}

router.get('/your-account', (req, res) => {
    User.findOne({
        where: {
            id: req.user.id
        }
    }).then((user) => {
        let src = "/uploads/staff_pictures/" + user.image // to pass in the path for img src in handlebars
        res.render('staff/accountDetails', {layout: staffMain, user, src})
    }).catch((err) => {
        console.log(err)
        res.redirect('/staff/error')
    })
});

router.put('/change-password/:id', (req, res) => { // staff/admin changing their OWN password; this is provided they know their old password
    let {oldpw, newpw, newpw2} = req.body;
    User.findOne({
        where: {
            id: req.user.id
        }
    }).then((user) => {
        let check = bcrypt.compareSync(oldpw, user.password) // compares to see if they inputted the correct old password
        if (check) {
            if (newpw == newpw2) {
                pw = bcrypt.hashSync(newpw, 10); // hash for secure storage
                User.update({
                    password: pw
                }, {
                    where: {
                        id: req.user.id
                    }
                })
                alertMessage(res, 'success', 'Successfully changed password!', true);
                req.logout()
                res.redirect('/staff-login');
            } else {
                alertMessage(res, 'danger', 'New passwords must match.', true);
                res.redirect('/staff/your-account');
            }
        } else {
            alertMessage(res, 'danger', 'Old password is incorrect.', true);
            res.redirect('/staff/your-account');
        }
    }).catch((err) => {
        console.log(err);
        res.redirect('/staff/error');
    })
});



router.get('/pdf/:id', (req, res) => { // pdf for staff summary/profile. req.param.id is staffId, so normal customers do not get a pdf
    User.findOne({
        where: { // retrieving user object
            staffId: req.params.id
        }
    }).then((user) => { // using retrieved user to construct pdf
        var html = fs.readFileSync('./views/staff/staffPDF.handlebars', 'utf-8') // the format of the pdf
        var options = { // various options
            format: "A4",
            orientation: "portrait",
            border: "10mm",
            header: {
                height: "5mm"
            },
            "footer": {
                "height": "10mm",
                "contents": {
                    default: 'Copyright © 2019 Monoqlo Inc. All rights reserved.'
                }
            }
        }
        var x = {'image': user.image, 'fname': user.fname, 'lname': user.lname, 'type': user.type, 'staffId': user.staffId, 'email': user.email, 'gender': user.gender, 'dob': user.dob, 'hp': user.hp, 'address': user.address}
        var document = {
            html: html,
            data: {
                staff: x // passes in data for handlbars to cast into the staches
            },
            path: "./public/pdf/output.pdf"
        };
        pdf.create(document, options)
            .then(ress => {
                console.log(ress);
                fs.readFile(ress['filename'], function (err,data){
                    if (err) throw err;
                    res.contentType("application/pdf");
                    res.send(data);
                });
            })
            .catch(error => {
                console.error(error)
            });
    }).catch(err => console.log(err))
});

//item routes

router.get('/item/view-all', (req, res) => {
    Item.findAll({
        raw: true
    })
        .then((item) => {
            res.render('staff/itempage', {
                item : item,
                layout:staffMain
        })
    })
    
});

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

router.get('/item/create', (req, res) => {
    res.render('staff/createItem', { layout: staffMain })
});

router.post('/item/create', (req, res) => {
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

router.get('/item/edit/:itemSerial', (req, res) => {
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

router.put('/item/save-edited/:itemSerial', (req, res) => {
    let {itemCost, itemPrice, itemDescription} = req.body
    Item.findOne({
        where: {
            itemSerial:req.params.itemSerial
        },raw: true
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
router.get('/item/discontinue/:itemSerial', (req, res) => {
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


router.put('/item/save-discontinue/:itemSerial', (req, res) => {
    Item.findOne({
        where: {
            itemSerial: req.params.itemSerial
        }, raw: true
    }).then((item) => {
        // variables to be updated
        // only select variables can be edited
        Item.update({
            status : "Discontinued"
        }, {
            where: {
                itemSerial: req.params.itemSerial
            }
        })
        // redirects back to the main item page
        res.redirect('/staff/item/view-all');
    }).catch(err => console.log(err)); // To catch no item serial
});


//Inventory Routes
router.get('/inventory', (req, res) => {
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

router.get('/inventory/stock/view-orders', (req, res) => {
    StockOrder.findAll({
        raw: true
    }).then((stockorder) => {
            res.render('staff/stockOrders', {
                stockorder,
                layout: staffMain
            })
        })
});

router.get('/inventory/stock/order/:itemSerial', (req, res) => {
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


router.post('/inventory/stock/order/:itemSerial', (req, res) => {
    let errors = [];

    //Adds new item
    // let stockorderDate = moment(req.body.stockorderDate, 'DD-MM-YYY');
    let stockorderDate = new DATEONLY();
    let shipmentStatus = req.body.shipmentStatus;
    let shipmentDate = moment(req.body.shipmentDate, 'YYYY-MM-DD');
    let itemSerial = req.body.itemSerial;
    let stockorderQuantity = req.body.stockorderQuantity;
    let receivedDate = undefined;

    StockOrder.create({
        stockorderDate,
        shipmentStatus,
        shipmentDate,
        itemSerial,
        stockorderQuantity,
        receivedDate
    }).then(stockorder => {
        res.redirect('/staff/inventory/stock/view-orders');
    })
        .catch(err => res.render('/staff/errorpage', { errors }))

});

router.get('/inventory/stock/receive/:id', (req, res) => {
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

router.put('/inventory/stock/save-recieve/:id', (req, res) => {
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


//error page
router.get('/error', (req, res) => {
    res.render('staff/errorpage', {
        layout: staffMain
    })
});

router.use('/admin', adminAuth, adminRoute);

module.exports = router;