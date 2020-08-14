// staff side routing goes here

const express = require('express');
const router = express.Router();
const User = require('../models/User');
const sNotif = require('../models/StaffNotifs');
const alertMessage = require('../helpers/messenger');
const bcrypt = require('bcryptjs');
const mysql = require('mysql');
const passport = require('passport');
const staffMain = "../layouts/staff";
const Item = require('../models/Item');
const moment = require('moment');
const StockOrder = require('../models/StockOrder');
const ensureAuthenticated = require('../helpers/auth'); // to verify that a user is logged in
const staffAuth = require('../helpers/staffAuth'); // to verify that user logged in is a Staff
const adminAuth = require('../helpers/adminAuth'); // to verify that user logged in is an Admin
const pdf = require('pdf-creator-node');
const fs = require('fs');
const sequelize = require('sequelize');
const Op = sequelize.Op;
const upload = require('../helpers/staffUpload');
const path = require('path')

// var Handlebars = require("handlebars");
// var MomentHandler = require("handlebars.moment");
// MomentHandler.registerHelpers(Handlebars);

router.get('/logout', (req, res) => {
    req.logout();
    res.redirect('/');
});

router.get('/home', (req, res) => {
        res.render('staff/staffhome', {layout: staffMain});
});

router.post('/upload', (req, res) => {
    console.log('post upload')
    if (!fs.existsSync('./public/uploads/staff_pictures/')) {
        fs.mkdirSync('./public/uploads/staff_pictures/')
    }
    upload(req, res, (err) => {
        if (err) {
            res.json({err: err})
        } else {
            if (req.file === undefined) {
                res.json({err: err})
            } else {
                res.json({file: `/uploads/staff_pictures/${req.file.filename}`});
            }
        }
    });
})

// to retrieve ALL accounts, regardless of whether it's a staff or customer account.
// router.get('/accounts', ensureAuthenticated, staffAuth, adminAuth, (req, res) => {
//     User.findAll({
//         raw: true
//     })
//     .then((users) => {
//         res.render('staff/accountList', {
//             accounts: users,
//             layout: staffMain
//         });
//     })
// });

async function accountsData(req, res) {
    var sortBy = 'title';
	var order  = 'asc';
	var offset = 0;
    var limit  = 25;
    
    console.log("Incoming Query:");
	console.log(req.query);

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
		return res.status(400).end();
    }

    try {
        const total = await User.count();
        const accsList = await User.findAll({
            offset: offset,
            limit: limit,
            order: [
                [sortBy, order.toUpperCase()]
            ], 
            raw: true
        })
        return res.status(200).json({
            "total": total,
            "rows": accsList
        });
    }
    catch (error) {
        console.log("Accounts Listing Error");
        return res.status(500);
    }

}

router.get('/accounts', (req, res) => {
    User.findAll({
        raw: true
    })
    .then((users) => {
        res.render('staff/accountList', {
            accounts: users,
            layout: staffMain
        });
    })
})

router.get('/accounts-data', accountsData);

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
        return res.status(500);
    }
}

router.get('/announcements', (req, res) => {
    res.render('staff/allAnnouncements', {layout: staffMain});
});

router.get('/announcements-data', announcementsData);

router.get('/create-announcement', adminAuth, (req, res) => {
    console.log(req.body.preview);
    res.render('staff/createAnnouncements', {layout: staffMain});
});

router.post('/create-announcement', adminAuth, (req, res) => {
    let errors = [];

    let {title, description} = req.body;

    let date = new Date();
    date = date.toISOString().slice(0, 10);

    if (title.length == 0) {
        errors.push({text: "Please enter a title"});
    }

    if (errors.length > 0) {
        res.render("staff/createAnnouncements", {
            errors,
            date,
            description,
            layout: staffMain
        });
    } else {
        sNotif.create({date, title, description})
        .then(snotif => {
            console.log(date);
            alertMessage(res, 'success', 'Annoucement successfully added.', 'fas fa-sign-in-alt', true);
            res.redirect('/staff/announcements');
        })
        .catch(err => console.log(err));
    }
});

router.get('/create-staff', (req, res) => {
    res.render('staff/createStaff', {layout: staffMain});
});

router.post('/create-staff', (req, res) => {
    let errors = [];

    let {type, fname, lname, gender, dob, hp, address, password, pw2} = req.body;

    let isnum = /^\d+$/.test(hp);
    
    if (password !== pw2) {
        errors.push({text: 'Password must match'});
    }

    if (password.length < 8 || pw2.length < 8 ) {
        errors.push({text: 'Password must be at least 8 characters'});
    }

    if (hp.length != 8 || isnum == false) {
        errors.push({text: 'Please enter a valid contact number.'});
    }

    if (errors.length > 0) {
        res.render('staff/createStaff', {
            errors,
            fname,
            lname,
            dob,
            hp,
            address,
            layout: staffMain
        });
    } else {
        let image;
        User.max('id')
        .then((x) => {
            x = parseInt(x) + 1
            let p = './public/uploads/staff_pictures/' + x.toString()
            let type1 = p + '.jpg'
            let type2 = p + '.jpeg'
            let type3 = p + '.png'
            console.log(type1)
            console.log(type2)
            console.log(type3)
            if (fs.existsSync(type1)) {
                image = path.basename(type1);
                console.log('type1!')
            } else if (fs.existsSync(type2)) {
                image = path.basename(type2);
                console.log('type2!')
            } else if (fs.existsSync(type3)) {
                image = path.basename(type3);
                console.log('type3!')
            } else {
                image = 'staff.png'
            }
        })
        User.max('staffId')
        .then(c => {
            password = bcrypt.hashSync(password, 10);
            let staffId = (1 + parseInt(c)).toString().padStart(6, '0');
            let domain = "@monoqlo.com";
            email = staffId + domain;
            User.create({type, staffId, image, email, fname, lname, gender, dob, hp, address, password})
            .then(user => {
                res.redirect('/staff/accounts');
                alertMessage(res, 'success', user.name + ' added. Please login.', 'fas fa-sign-in-alt', true);
            })
        })
        .catch(err => console.log(err));
    }
});

router.get('/your-account', (req, res) => {
    User.findOne({
        where: {
            id: req.user.id
        }
    }).then((user) => {
        let src = "/uploads/staff_pictures/" + user.image
        console.log(src)
        res.render('staff/accountDetails', {layout: staffMain, user, src})
    })
});

router.put('/change-password/:id', (req, res) => {
    let {oldpw, newpw, newpw2} = req.body;
    User.findOne({
        where: {
            id: req.user.id
        }
    }).then((user) => {
        let check = bcrypt.compareSync(oldpw, user.password)
        console.log(check);
        if (check) {
            if (newpw == newpw2) {
                pw = bcrypt.hashSync(newpw, 10);
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
    }).catch(err => console.log(err))
});

router.get('/manage-staff/:id', adminAuth, (req, res) => {
    User.findOne({
        where: {
            id: req.params.id
        }
    }).then((user)=> {
        res.render("staff/updateStaff", {layout: staffMain, user});
    }).catch(err => console.log(err));
});

router.put('/save-staff/:id', adminAuth, (req, res) => {
    let {type, fname, lname, gender, dob, hp, address, resetpw} = req.body;
    console.log(resetpw);
    if (resetpw == "reset") {
        pw = bcrypt.hashSync("23456789", 10);
    } else {
        User.findOne({
            where: {
                id: req.params.id
            }
        }).then((user) => {
            pw = user.password
        }).catch(err => console.log(err))
    }
    User.update({
        type: type,
        fname: fname,
        lname: lname,
        gender: gender,
        dob: dob,
        hp: hp,
        address: address,
        password: pw
    }, {
        where: {
            id: req.params.id
        }
    }).then(() => {
        res.redirect("/staff/accounts");
    }).catch(err => console.log(err));
});

router.get('/delete-staff/:id', adminAuth, (req, res) => {
    User.findOne({
        where: {
            id: req.params.id
        }
    }).then((user) => {
        if (user == null) {
            alertMessage(res, "danger", "User does not exist", 'fas fa-exclamation-circle', true);
            res.redirect('/staff/accounts');
        } else {
            User.destroy({
                where: {
                    id: req.params.id
                }
            }).then((user) => {
                alertMessage(res, "info", "Staff deleted", 'fas fa-exclamation-circle', true);
                res.redirect("/staff/accounts");
            }).catch(err => console.log(err));
        };
    }).catch(err => console.log(err))
});

router.get('/staff-pdf/:id', (req, res) => {
    User.findOne({
        where: {
            id: req.params.id
        }
    }).then((user) => {
        var html = fs.readFileSync('./views/staff/staffPDF.handlebars', 'utf-8')
        var options = {
            format: "A4",
            orientation: "portrait",
            border: "10mm",
            header: {
                height: "10mm",
                contents: 'Monoqlo Staff Summary'
            },
            "footer": {
                "height": "14mm",
                "contents": {
                    default: 'Copyright © 2019 Monoqlo Inc. All rights reserved.'
                }
            }
        }
        var x = {'fname': user.fname, 'lname': user.lname, 'type': user.type, 'email': user.email, 'dob': user.dob, 'hp': user.hp, 'address': user.address}
        var document = {
            html: html,
            data: {
                staff: x
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

router.post('/item/create', (req, res) => {
    let errors = [];

    //Adds new item

    console.log(req);
    // form data and variables
    let itemName = req.body.itemName;
    let itemSerial = req.body.itemSerial;
    let itemCategory = req.body.itemCategory === undefined ? '' : req.body.itemCategory.toString();
    let itemGender = req.body.itemGender === undefined ? '' : req.body.itemGender.toString();
    let itemCost = req.body.itemCost;
    let itemPrice = req.body.itemPrice;
    let itemDescription = req.body.itemDescription;
    let stockLevel = 0;
    let status = "In Production"
    // check for errors if not will add to db
    if (errors.length > 0) {
        res.render("/staff/createItem", {
            errors, itemName, itemSerial, itemCategory, itemGender, itemCost, itemPrice, itemDescription, stockLevel, status, layout: staffMain
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
            alertMessage(res, 'success', 'Item successfully added', true);
            res.redirect('/staff/item/view-all');
        })
            .catch(err => console.log(err));
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



router.get('/item/create', (req, res) => {
    res.render('staff/createItem', { layout: staffMain })
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

router.get('/inventory/order-stock/:itemSerial', (req, res) => {
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
    


router.post('/inventory/order-stock/:itemSerial', (req, res) => {
    let errors = [];

    //Adds new item
    let stockorderDate = moment(req.body.stockorderDate, 'DD-MM-YYY');
    let shipmentStatus = req.body.shipmentStatus;
    let shipmentDate = moment(req.body.shipmentDate, 'DD-MM-YYY');
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
            res.redirect('/staff/inventory');
        })
        .catch(err => console.log(err))

})


module.exports = router;