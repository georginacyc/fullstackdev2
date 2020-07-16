// the codes below ensures that only staff are able to access certain pages like /staff/* pages

const alertMessage = require('./messenger');

const staffAuth = (req, res, next) => {
    if(req.user.type == "Staff" || req.user.type == "Admin") { // checks if user logged in is a member of staff
        return next();
    }
    alertMessage(res, 'danger', 'Access denied. Staff Only.', 'fas fa-exclamation-circle', true);
    req.logout();
    res.redirect('/');
};

module.exports = staffAuth;