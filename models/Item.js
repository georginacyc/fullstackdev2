// database models for products
const Sequelize = require('sequelize');
const db = require('../config/DBConfig');

const Item = db.define('item', {
    itemSerial: {
        type: Sequelize.STRING, primaryKey: true
    },
    itemName: {
        type: Sequelize.STRING
    },
    image: {
        type: Sequelize.STRING,
        defaultValue: 'item.png'
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
    stockLevel: {
        type: Sequelize.INTEGER
    },
    status: {
        type: Sequelize.STRING
    }
});

module.exports = Item;