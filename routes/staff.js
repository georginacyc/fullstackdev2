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

// var Handlebars = require("handlebars");
// var MomentHandler = require("handlebars.moment");
// MomentHandler.registerHelpers(Handlebars);

let domain = "@monoqlo.com";

var con = mysql.createConnection({ // creating a connection to query database below.
    host: "localhost",
    user: "monoqlo",
    password: "monoqlo",
    database: "monoqlo"
});

router.get('/login', (req, res) => {
    res.render('staff/login');
});

router.post('/login', (req, res, next) => {
    passport.authenticate('local', {
        successRedirect: '/staff/home',
        failureRedirect: '/staff/login',
        failureFlash: true,
    }) (req, res, next);
});

router.get('/logout', (req, res) => {
    req.logout();
    res.redirect('/');
});

router.get('/home', ensureAuthenticated, staffAuth, (req, res) => {
        res.render('staff/staffhome', {layout: staffMain});
});

// to retrieve ALL accounts, regardless of whether it's a staff or customer account.
router.get('/accounts', ensureAuthenticated, staffAuth, adminAuth, (req, res) => {
    User.findAll({
        raw: true
    })
    .then((users) => {
        res.render('staff/accountList', {
            accounts: users,
            layout: staffMain
        });
    })
});

// retrieves all announcements
router.get('/announcements', ensureAuthenticated, staffAuth, (req, res) => {
    let allannouncements = []
    con.query('SELECT * FROM monoqlo.snotifs AS notifs ORDER BY id DESC;', function(err, results, fields) {
        if (err) throw err;
        let count = 0;
        while (count < results.length) { // ensures that count never exceeds number of rows returned, to prevent an Index-Out-of-Range error.
            let a = {};
            a['date'] = results[count].date;
            a['title'] = results[count].title;
            a['description'] = results[count].description;
            
            allannouncements.push(a);
            count += 1;
        }
        res.render('staff/allAnnouncements', {layout:staffMain, allannouncements: allannouncements})
    })
})

router.get('/createAnnouncement', ensureAuthenticated, staffAuth, adminAuth, (req, res) => {
    res.render('staff/createAnnouncements', {layout: staffMain});
})

router.post('/createAnnouncement', ensureAuthenticated, staffAuth, adminAuth, (req, res) => {
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

router.get('/createStaffAccount', ensureAuthenticated, staffAuth, adminAuth, (req, res) => {
    res.render('staff/createStaff', {layout: staffMain});
});

router.post('/createStaffAccount', ensureAuthenticated, staffAuth, adminAuth, (req, res) => {
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
            type,
            fname,
            lname,
            gender,
            dob,
            hp,
            address,
            password,
            pw2,
            layout: staffMain
        });
    } else {
        let num = ""
        password = bcrypt.hashSync(password, 10);

        con.query("SELECT COUNT(*) AS tableCheck FROM users WHERE type='Admin' OR type='Staff'", function(err, result, fields) {
            
            let email = ""
    
            if (err) throw err;
            if (result[0].tableCheck > 0) {
                con.query("SELECT MAX(id) AS count FROM users WHERE type='Admin' or type='Staff'", function(err, result, fields) {
                    if (err) throw err;
                    num = result[0].count + 1;
                    num = num.toString().padStart(6, "0");
                    email = num.toString() + domain;
                    User.create({type, email, fname, lname, gender, dob, hp, address, password})
                    .then(user => {
                        res.redirect('/staff/accounts');
                        alertMessage(res, 'success', user.name + ' added. Please login.', 'fas fa-sign-in-alt', true);
                    }).catch(err => console.log(err));
                });
            } else {
                num = "000001";
                email = num.toString() + domain;
                User.create({type, email, fname, lname, gender, dob, hp, address, password})
                .then(user => {
                    res.redirect('/staff/accounts');
                    alertMessage(res, 'success', user.name + ' added. Please login.', 'fas fa-sign-in-alt', true);
                })
                .catch(err => console.log(err));
            };
        });
    };
});


router.get('/yourAccount', ensureAuthenticated, staffAuth, (req, res) => {
    User.findOne({
        where: {
            id: req.user.id
        }
    }).then((user) => {
        res.render('staff/accountDetails', {layout: staffMain, user})
    })
});

router.put('/changePassword/:id', ensureAuthenticated, staffAuth, (req, res) => {
    let {oldpw, newpw, newpw2} = req.body;
    User.findOne({
        where: {
            id: req.user.id
        }
    }).then((user) => {
        check = bcrypt.compareSync(oldpw, user.password)
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
                res.redirect('/staff/login');
            } else {
                alertMessage(res, 'danger', 'New passwords must match.', true);
                res.redirect('/staff/yourAccount');
            }
        } else {
            alertMessage(res, 'danger', 'Old password is incorrect.', true);
            res.redirect('/staff/yourAccount');
        }
    }).catch(err => console.log(err))
});

router.get('/manageAccount/:id', ensureAuthenticated, staffAuth, adminAuth, (req, res) => {
    User.findOne({
        where: {
            id: req.params.id
        }
    }).then((user)=> {
        res.render("staff/updateStaff", {layout: staffMain, user});
    }).catch(err => console.log(err));
});

router.put('/saveStaff/:id', ensureAuthenticated, staffAuth, adminAuth, (req, res) => {
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

router.get('/deleteStaff/:id', ensureAuthenticated, staffAuth, adminAuth, (req, res) => {
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

router.get('/staffPDF/:id', (req, res) => {
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

router.get('/itempage', (req, res) => {
    Item.findAll({
        raw: true
    })
        .then((item) => {
            res.render('staff/itempage', {
            layout:staffMain
        })
    })
    
});

router.get('/createItem', (req, res) => {
    res.render('staff/createItem', { layout: staffMain })
});

router.post('/createItem', (req, res) => {
    let errors = [];

    //Adds new item
    let itemName = req.body.itemName;
    let itemSerial = req.body.itemSerial;
    let itemCategory = req.body.itemCategory;
    let itemGender = req.body.itemGender;
    let itemCost = req.body.itemCost;
    let itemPrice = req.body.itemPrice;
    let itemDescription = req.body.itemDescription;

    Item.create({
        itemName,
        itemSerial,
        itemCategory,
        itemGender,
        itemCost,
        itemPrice,
        itemDescription
    }).then(item => {
        res.redirect('/staff/item');
    })
    .catc(err => console.log(err))

})

//Inventory Routes
router.get('/inventory', (req, res) => {
    res.render('staff/inventory', { layout: staffMain })
});

//Stock Order Routes

router.get('/createStockOrder', (req, res) => {
    res.render('staff/createStockOrder', {
        layout: staffMain
    })
});

router.post('/createStockOrder', (req, res) => {
    let errors = [];

    //Adds new item
    let stockorderDate = moment(req.body.stockorderDate, 'DD-MM-YYY');
    let shipmentStatus = req.body.shipmentStatus;
    let shipmentDate = moment(req.body.shipmentDate, 'DD-MM-YYY');
    let itemSerial = req.body.itemSerial;
    let stockorderQuantity = req.body.stockorderQuantity;
    let receivedDate = "";

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
        .catc(err => console.log(err))

})


module.exports = router;