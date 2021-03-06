// codes below checks that the user is logged in

const alertMessage = require('./messenger');

const ensureAuthenticated = (req, res, next) => {
    if(req.isAuthenticated()) {
        return next();
    }
    alertMessage(res, 'danger', 'Access denied', 'fas fa-exclamation-circle', true);
    res.redirect('/')
};

module.exports = ensureAuthenticated;