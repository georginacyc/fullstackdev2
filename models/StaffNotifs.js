const Sequelize = require('sequelize');
const db = require('../config/DBConfig');

const StaffNotifs = db.define('snotif', {
    date: {
        type: Sequelize.DATEONLY
    },
    title: {
        type: Sequelize.STRING
    },
    description: {
        type: Sequelize.STRING
    }
});

module.exports = StaffNotifs;