const express = require('express');
const router = express.Router();
const User = require('../models/User');
const sNotif = require('../models/StaffNotifs');
const alertMessage = require('../helpers/messenger');
const bcrypt = require('bcryptjs');
const staffMain = "../layouts/staff";
const fs = require('fs');
const sequelize = require('sequelize');
const Op = sequelize.Op;
const upload = require('../helpers/staffUpload');
const multer = require('multer');
const path = require('path');

router.get('/create-announcement', (req, res) => {
    console.log(req.body.preview);
    res.render('staff/createAnnouncements', {layout: staffMain});
});

router.post('/create-announcement', (req, res) => {
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
        }).catch((err) => {
            console.log(err);
            res.redirect('/staff/error');
        });
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
        upload(req, res, (err) => {
            if (err) {
                console.log(err)
            } else {
                if (req.file === undefined) {
                    console.log(err)
                }
            }
        });
        let image;
        User.max('id')
        .then((x) => {
            x = parseInt(x) + 1
            let p = './public/uploads/staff_pictures/' + x.toString()
            let type1 = p + '.jpg'
            let type2 = p + '.jpeg'
            let type3 = p + '.png'
            if (fs.existsSync(type1)) {
                image = path.basename(type1);
            } else if (fs.existsSync(type2)) {
                image = path.basename(type2);
            } else if (fs.existsSync(type3)) {
                image = path.basename(type3);
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
                res.redirect('/staff/admin/accounts');
                alertMessage(res, 'success', user.name + ' added. Please login.', 'fas fa-sign-in-alt', true);
            }).catch((err) => {
                console.log(err);
                res.redirect('/staff/error');
            });
        }).catch(err => console.log(err));
    }
});
router.get('/manage-staff/:id', (req, res) => {
    User.findOne({
        where: {
            staffId: req.params.id
        }
    }).then((user)=> {
        res.render("staff/updateStaff", {layout: staffMain, user});
    }).catch((err) => {
        console.log(err);
        res.redirect('/staff/error');
    });
});

router.put('/save-staff/:id', (req, res) => {
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
    upload(req, res, (err) => {
        if (err) {
            console.log(err)
        } else {
            if (req.file === undefined) {
                console.log(err)
            }
        }
    });
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
        res.redirect("/staff/admin/accounts");
    }).catch((err) => {
        console.log(err);
        res.redirect('/staff/error');
    });
});

router.get('/delete-user/:id', (req, res) => {
    User.findOne({
        where: {
            id: req.params.id
        }
    }).then((user) => {
        if (user == null) {
            alertMessage(res, "danger", "User does not exist", 'fas fa-exclamation-circle', true);
            res.redirect('/staff/admin/accounts');
        } else {
            User.destroy({
                where: {
                    id: req.params.id
                }
            }).then((user) => {
                alertMessage(res, "info", "User deleted", 'fas fa-exclamation-circle', true);
                res.redirect("/staff/admin/accounts");
            }).catch((err) => {
                console.log(err);
                res.redirect('/staff/error');
            });
        };
    }).catch((err) => {
            console.log(err);
            res.redirect('/staff/error');
        });
})

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
		res.redirect('/staff/error');
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
        res.redirect('/staff/error');
    }

}

module.exports = router;