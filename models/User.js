const Sequelize = require('sequelize');
const db = require('../config/DBConfig');

const User = db.define('user', {
    type: {
        type: Sequelize.STRING
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
    address: {
        type: Sequelize.STRING
    },
    password: {
        type: Sequelize.STRING
    },
});

module.exports = User;