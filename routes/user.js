// user related routing goes here (i.e. logging in, account details, etc.)
const express = require('express');
const router = express.Router();
const passport = require('passport');
const User = require('../models/User');
const alertMessage = require('../helpers/messenger');
const bcrypt = require('bcryptjs');
const Custorder = require('../models/CustOrders');
const CustOrders = require('../models/CustOrders');
const Item = require('../models/Item');
const ensureAuthenticated = require('../helpers/auth');
//const { in } = require('sequelize/types/lib/operators');


router.get('/error', (req, res) => {
    res.render('user/errorpage')
})

// Register User
router.get('/register', (req, res) => {
	res.render('user/register') // renders views/register.handlebars
});

router.post('/register', (req, res) => {
    let type = "User";
	let errors = [];
    // Retrieves fields from register page from request body
    let {fname,lname,gender,dob,hp,size,address,city,country,postalcode, email, password, password2} = req.body;
    let patt3 = new RegExp('[689]{1}[0-9]{7}'); // pattern to check hp against
    let patt2 = new RegExp('[0-9]{6}'); // pattern to check postal code against

    // Checks if both passwords entered are the same
    if(password !== password2) {
        errors.push({text: 'Passwords do not match'});
    }

    // Checks that password length is more than 4
    if(password.length < 8) {
        errors.push({text: 'Password must be at least 8 characters'});
    }
    
    
    if (patt3.test(hp) == false) {
        errors.push({text: 'Please enter a valid contact number.'});
    }

    if (patt2.test(postalcode) == false) {
        errors.push({text: 'Please enter a valid postal code'});
    }

    if (errors.length > 0) {
        res.render('user/register', {
            errors,
            fname,
            lname,
            gender,
            dob,
            hp,
            address,
            city,
            country,
            postalcode,
            size,
            email,
            password,
            password2
   
    });
    } else {
        // If all is well, checks if user is already registered
        User.findOne({ where: {email: req.body.email} })
            .then(user => {
                if (user) {
                // If user is found, that means email has already been
                    // registered
                res.render('user/register', {
                    error: user.email + ' already registered',
                    fname,
                    lname,
                    gender,
                    dob,
                    hp,
                    address,
                    city,
                    country,
                    postalcode,
                    size,
                    email,
                    password,
                    password2
                });
            } else {
        
        password = bcrypt.hashSync(password, 10);
        // Create new user record
        User.create({ type,fname,lname,gender,dob,hp,address,postalcode,size, email, password })
            .then(user => {
            alertMessage(res, 'success',  ' Account created, please login', user.fname + 'fas fa-sign-in-alt', true);
            res.redirect('/');
            })
            .catch(err => console.log(err));
            }
        });
        }
    });
    

// Login User
router.get('/login', (req, res) => {
	res.render('user/login') // renders views/login.handlebars
});


// Login Form POST => /user/login
router.post('/login', (req, res, next) => {
    passport.authenticate('local', {
    successRedirect: '/', 
    failureRedirect: '/user/login', 
    failureFlash: true,
    }) (req, res, next);
});

// User entering homepage after login
router.get('/', (req, res) =>{
    name = req.user.fname;
    if (user == "User") {
        res.render('/');
    } else{
        res.render('/');
    }
} );

// User Profile
router.get('/edit-user-account', (req,res)=>{
    User.findOne({
        where: {
            id: req.user.id
        }
    }).then((user) => {
        res.render('user/edit-user-account', user);
    }) 
});
// User reset password page
router.get('/reset-password', (req,res)=>{
    User.findOne({
        where: {
            id: req.user.id
        }
    }).then((user) => {
        res.render('user/reset-password', {user});
    }) 
});




// Save user profile
router.put('/save-user/:id', (req, res) => {
    // Retrieves edited values from req.body
    let {fname, lname, hp, address,city,country,postalcode,size,resetpw} = req.body;
    let {oldpw,newpw,newpw2} = req.body;
    let pw;
    if (resetpw == "reset") {
        
        
        console.log(oldpw)
        
        User.findOne({
            where: {
                id: req.user.id
            }
        }).then((user) => {
            check = bcrypt.compareSync(oldpw, user.password)
            console.log(check);
            if (check) {
                if (oldpw !=null, newpw == newpw2) {
                    
                    pw = bcrypt.hashSync(newpw, 10);
                    alertMessage(res, 'success', 'Successfully changed password!', true);
                    User.update({
        
                        fname: fname,
                        lname: lname,
                        hp: hp,
                        address: address,
                        city: city,
                        country: country,
                        postalcode: postalcode,
                        size: size,
                        password: pw
                        
                        
                    
                    }, {
                        where: {
                            id: req.user.id
                    }
                    }).then(() => {
                            
                            console.log(pw)
                    res.redirect('/user/reset-password');
                    }).catch(err => console.log(err));
                    req.logout()
                    res.redirect('/user/login');
                    
                } else {
                    alertMessage(res, 'danger', 'New passwords must match.', true);
                    res.redirect('/user/reset-password');
                }
            } else {
                
                alertMessage(res, 'danger', 'Old password is incorrect.', true);
                res.redirect('/user/reset-password');
            }
        }).catch(err => console.log(err));
        // if user is not changing password, update other details accordingly
    } else {
        User.findOne({
            where: {
                id: req.user.id
            }
        }).then((user) => {
            pw = user.password
            User.update({
        
                fname: fname,
                lname: lname,
                hp: hp,
                address: address,
                city: city,
                country: country,
                postalcode: postalcode,
                size: size,
                password: pw
                
                
            
            }, {
                where: {
                    id: req.user.id
            }
            }).then(() => {
            res.redirect('/user/edit-user-account');
            }).catch(err => console.log(err));
            
        }).catch(err => console.log(err));

    }
    
});

// Logout User
router.get('/logout', (req, res) => {
	req.logout();
	res.redirect('/');
});
router.get('/deleteacc',(req, res)=>{ 
    console.log("delete");
    User.findOne({
        where: {
            id: req.user.id
        }
    }).then((user) =>
   
    User.destroy({
        where: {
            id: req.user.id
        }
        })).then((User) => {
        //alertMessage(res, 'success', 'You have deleted your account, please register to be able to login again.', true);
        req.logout();
        res.send('/user/login?delete=1');
        })
} );
router.get('/accounts', (req, res) => {
    User.findAll({
        raw: true
    })
    .then((users) => {
        res.render('user/userAccounts', {
            accounts: users,
           
        });
    })
     //res.render('user/userAccount');
});
router.get('/cart', (req, res) => {
    res.render('user/cart')
});
//user shopping cart
router.get('/cart/:itemSerial', (req, res) => {
    let carts = {}
    Item.findOne({
        where: {
            itemSerial: req.params.itemSerial
        }, raw: true
    })
        .then((carts) => {
            carts[item.itemSerial] = 1
            res.locals.carts = carts
            res.redirect('/user/cart')
    }).catch(err => console.log(err));
});

//user checkout
router.get('/checkout', (req, res) => {
	res.render('user/checkout') // renders views/checkout.handlebars
});



router.get('/orders', (req, res) => {
    CustOrders.findAll({
        raw: true
    })
    .then((orders) => {
    // pass object to orders.handlebar
        res.render('user/orders', {
            orders : orders,});
    })
    .catch(err => console.log(err));
});

router.post('/checkout', (req, res) => {
    let errors = [];
    // Retrieves fields from page from request body
    let {card,cardcvv,expiredate} = req.body;

    // Checks cvv is 3 digit
    if(cardcvv.length != 3) {
        errors.push({text: 'wrong cvv'});
    }
    // Checks that card length is correct
    //if(card.length != 16) {
        //errors.push({text: 'invalid card'});
    //}
    // checks if card starting with 4 , 4-visa
    //if (card[0] != 4) {
        //errors.push({text: 'invaid card'})
    //}
    if (expiredate.length != 5) {
        errors.push({text: 'invaid expiry date'})
    }
    if (errors.length > 0) {
        res.render('user/checkout', {
            name,
            card,
            cardcvv,
            expiredate
    })
    }
    else{
        let userId = req.userId
        let itemSerial = "123"
        let quantity = 1
        let couponCode = "10%"
        let total_Amt = 20
        let comments = null
        let orderDate = '2020-08-18'
        CustOrders.create({
            userId,
            itemSerial,
            quantity,
            couponCode,
            total_Amt,
            comments,
            orderDate
        }) 
        .then(custorder => {
            res.redirect('/user/orders');})
        .catch(err => console.log(err))
    }

});


router.use('/user/cart', ensureAuthenticated);

module.exports = router;