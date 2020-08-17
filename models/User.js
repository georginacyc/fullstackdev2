const Sequelize = require('sequelize');
const db = require('../config/DBConfig');
const sequelize = require('../config/DBConfig');

const User = db.define('user', {
    type: {
        type: Sequelize.STRING
    },
    staffId: {
        type: Sequelize.STRING
    },
    image: {
        type: Sequelize.STRING,
        defaultValue: 'staff.png'
    },
    email: {
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
        type: Sequelize.DATEONLY
    },
    hp: {
        type: Sequelize.STRING
    },
    size: {
        type: Sequelize.STRING
    },
    address: {
        type: Sequelize.STRING
    },
    city: {
        type: Sequelize.STRING
    },
    country: {
        type: Sequelize.STRING,
        defaultValue: 'Singapore'
    },
    postalcode: {
        type: Sequelize.STRING
    },
    postalcode: {
        type: Sequelize.STRING
    },
    password: {
        type: Sequelize.STRING
    },
    lastLogin: {
        type: Sequelize.STRING,
        defaultValue: 'N/A'
    }
});

module.exports = User;