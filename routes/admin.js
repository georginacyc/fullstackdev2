// routing for admin pages

const express = require('express');
const router = express.Router();
const User = require('../models/User');
const sNotif = require('../models/StaffNotifs');
const alertMessage = require('../helpers/messenger');
const bcrypt = require('bcryptjs');
const staffMain = "../layouts/staff";
const fs = require('fs');
const sequelize = require('sequelize');
const upload = require('../helpers/staffUpload');
const multer = require('multer');
const path = require('path');

router.get('/create-announcement', (req, res) => {
    res.render('staff/createAnnouncements', {layout: staffMain});
});

router.post('/create-announcement', (req, res) => {
    let errors = [];
    let {title, description} = req.body;
    let date = new Date();
    date = date.toISOString().slice(0, 10); // get just the date

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
    let {type, fname, lname, gender, dob, hp, address, postalcode, password, pw2} = req.body;
    let hpPatt = new RegExp('[689]{1}[0-9]{7}'); // pattern to check hp against
    let postalPatt = new RegExp('[0-9]{6}'); // pattern to check postal code
    
    if (password !== pw2) {
        errors.push({text: 'Password must match'});
    }
    if (password.length < 8 || pw2.length < 8) {
        errors.push({text: 'Password must be at least 8 characters'});
    }
    if (hpPatt.test(hp) == false) {
        errors.push({text: 'Please enter a valid contact number.'});
    }
    if (postalPatt.test(postalcode) == false) {
        errors.push({text: 'Please enter a valid postal code'})
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
        User.max('id') // retrieves highest id (not staffId), for file naming purposes
        .then((x) => {
            x = parseInt(x) + 1
            let p = './public/uploads/staff_pictures/' + x.toString() //creating most of the path
            let type1 = p + '.jpg'
            let type2 = p + '.jpeg'
            let type3 = p + '.png'
            if (fs.existsSync(type1)) { // basically checks what extension the file is, if it exists
                image = path.basename(type1);
            } else if (fs.existsSync(type2)) {
                image = path.basename(type2);
            } else if (fs.existsSync(type3)) {
                image = path.basename(type3);
            } else { // if file does not exist at all, use default
                image = 'staff.png'
            }
        })
        User.max('staffId') // retrieving the staffId to increment for next staff's staff ID
        .then(c => {
            password = bcrypt.hashSync(password, 10);
            let staffId = (1 + parseInt(c)).toString().padStart(6, '0');
            let domain = "@monoqlo.com";
            email = staffId + domain;
            User.create({type, staffId, image, email, fname, lname, gender, dob, hp, address, postalcode, password})
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

router.post('/upload-staff-picture', (req, res) => { // formless picture uploading for CREATING STAFF
    upload(req, res, (err) => {
        if (err) {
            res.json({file: '/uploads/staff_pictures/staff.png', err: err});
        } else {
            if (req.file === undefined) {
                res.json({file: '/uploads/staff_pictures/staff.png', err: err});
            } else {
                res.json({file: `/uploads/staff_pictures/${req.file.filename}`});
            }
        }
    });
}) 

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
    let errors = false;
    let {type, fname, lname, gender, dob, hp, address, postalcode, resetpw} = req.body;
    let pw;
    let hpPatt = new RegExp('[689]{1}[0-9]{7}'); // pattern to check hp against
    let postalPatt = new RegExp('[0-9]{6}'); // pattern to check postal code
    async function check() {
        if (resetpw == "reset") {
            pw = bcrypt.hashSync(lname.toLowerCase() + hp.slice(0, 4), 10); // resets password to staff's last name and first 4 numbers of their phone number
        } else {
            User.findOne({
                where: {
                    staffId: req.params.id
                }
            }).then((user) => {
                pw = user.password // retrieves original password
            }).catch((err) => {
                console.log(err);
                res.redirect('/staff/error');
            });
        }
    }
    if (hpPatt.test(hp) == false) {
        errors = true
        alertMessage(res, 'danger', 'Please enter a valid phone number.', '', true);
    }
    if (postalPatt.test(postalcode) == false) {
        errors = true
        alertMessage(res, 'danger', 'Please enter a valid postal code.', '', true);
    }
    if (errors) {
        res.redirect('/staff/admin/manage-staff/' + req.params.id)
    } else {
        check().then(() => {
            User.update({
                type: type,
                fname: fname,
                lname: lname,
                gender: gender,
                dob: dob,
                hp: hp,
                address: address,
                postalcode: postalcode,
                password: pw
            }, {
                where: {
                    staffId: req.params.id
                }
            }).then(() => {
                res.redirect("/staff/admin/accounts");
            }).catch((err) => {
                console.log(err);
                res.redirect('/staff/error');
            });
        }).catch((err) => {
            console.log(err);
            res.redirect('/staff/error');
        });
    }
});

router.post('/save-staff-picture/:id', (req, res) => { // formless picture uploading for when UPDATING STAFF DETAILS
    const storage2 = multer.diskStorage({
        destination: (req, file, callback) => {
            callback(null, './public/uploads/staff_pictures/');
        },
        filename: (req, file, callback) => {
            callback(null, req.params.id + path.extname(file.originalname));
        }
    });
    
    const upload2 = multer({
        storage: storage2,
        limits: {
            fileSize: 1000000
        },
        fileFilter: (req, file, callback) => {
            checkFileType(file, callback);
        }
    }).single('staffUpload2')
    
    function checkFileType(file, callback) {
        const filetypes = /jpeg|jpg|png/;
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = filetypes.test(file.mimetype);
    
        if (mimetype && extname) {
            return callback(null, true);
        } else {
            callback({message: 'Images Only. No GIFs.'})
        }
    }
    upload2(req, res, (err) => {
        if (err) {
            res.json({file: '/uploads/staff_pictures/staff.png', err: err});
        } else {
            if (req.file === undefined) {
                res.json({file: '/uploads/staff_pictures/staff.png', err: err});
            } else {
                res.json({file: `/uploads/staff_pictures/${req.file.filename}`});
            }
        }
    });
})

router.get('/confirm-delete/:id', (req, res) => {
    User.findOne({
        where: {
            id: req.params.id
        }, raw: true
    }).then((user) => {
        res.render('staff/confirmDelete', {layout: staffMain, user})
    })
})

router.get('/delete-user/:id', (req, res) => { // deletion for either normal user or staff/admin accounts
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