const alertMessage = require('./messenger');

const adminAuth = (req, res, next) => {
    if (req.user.type == "Admin") {
        return next();
    }
    alertMessage(res, 'danger', 'Access denied. Please contact your administrator if you require access.', 'fas fa-exclamation-circle', true);
    res.redirect('/staff/home');
};

module.exports = adminAuth;