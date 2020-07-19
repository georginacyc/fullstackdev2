// database models for products
const Sequelize = require('sequelize');
const db = require('../config/DBConfig');

const Item = db.define('item', {
    itemName: {
        type: Sequelize.STRING, primaryKey: true
    },
    itemSerial: {
        type: Sequelize.STRING
    },
    itemCategory: {
        type: Sequelize.STRING
    },
    itemGender: {
        type: Sequelize.STRING
    },
    itemCost: {
        type: Sequelize.FLOAT
    },
    itemPrice: {
        type: Sequelize.FLOAT
    },
    itemDescription: {
        type: Sequelize.STRING
    },
});

module.exports = Item;