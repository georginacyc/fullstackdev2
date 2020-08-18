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
const itemRoute = require('../routes/item');
const inventoryRoute = require('../routes/inventory');
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
    let pendingShipments = 0;
    let thisMonthSales = 0;
    let OOSitems = 0;
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
                itemCategory: 'Tops'
            }
        }).then((num) => {
            categoryData.push(num);
        }).catch(err => console.log(err));
        await Item.count({ // retrieve no. of bottoms
            where: {
                itemCategory: 'Bottoms'
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
        var x = {'image': user.image, 'fname': user.fname, 'lname': user.lname, 'type': user.type, 'staffId': user.staffId, 'email': user.email, 'gender': user.gender, 'dob': user.dob, 'hp': user.hp, 'address': user.address, 'postalcode': user.postalcode}
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

//error page
router.get('/error', (req, res) => {
    res.render('staff/errorpage', {
        layout: staffMain
    })
});

router.use('/admin', adminAuth, adminRoute);
router.use('/item', itemRoute);
router.use('/inventory', inventoryRoute);

module.exports = router;