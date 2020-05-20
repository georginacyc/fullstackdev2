const Sequelize = require('sequelize');
const db = require('../config/DBConfig');

const Staff = db.define('staff', {
    type: {
        type: Sequelize.STRING
    },
    fname: {
        type: Sequelize.STRING
    },
    lname: {
        type: Sequelize.STRING
    },
    gender: {
        type: Sequelize.STRING
    },
    dob: {
        type: Sequelize.DATE
    },
    hp: {
        type: Sequelize.STRING
    },
    address: {
        type: Sequelize.STRING
    },
    password: {
        type: Sequelize.STRING
    },
});

module.exports = Staff;