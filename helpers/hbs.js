const moment = require('moment');

module.exports = function(date, dateFmt) {
    return moment(date).format(dateFmt);
};

