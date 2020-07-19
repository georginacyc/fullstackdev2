// the code below is used to ensure that only admins are able to access certain pages like managing accounts with update and delete options

const alertMessage = require('./messenger');

const adminAuth = (req, res, next) => { // checks if user logged in is an admin
    if (req.user.type == "Admin") {
        return next();
    }
    alertMessage(res, 'danger', 'Access denied. Please contact your administrator if you require access.', 'fas fa-exclamation-circle', true);
    res.redirect('/staff/home');
};

module.exports = adminAuth;