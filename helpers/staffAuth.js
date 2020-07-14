const alertMessage = require('./messenger');

const staffAuth = (req, res, next) => {
    console.log('staffAuth');
    if(req.user.type == "Staff" || req.user.type == "Admin") {
        return next();
    }
    alertMessage(res, 'danger', 'Access denied. Staff Only.', 'fas fa-exclamation-circle', true);
    req.logout();
    res.redirect('/');
};

module.exports = staffAuth;