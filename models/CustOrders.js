// database models for orders made by user
const Sequelize = require('sequelize');
const db = require('../config/DBConfig');

const CustOrders = db.define('custorder', {
    orderId: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV1,
        primaryKey: true
    },
    userId: {
        type: Sequelize.STRING
    },
    itemSerial: {
        type: Sequelize.STRING
    },
    quantity: {
        type: Sequelize.INTEGER(3)
    },
    totalAmt: {
        type: Sequelize.INTEGER(3)
    },
    couponCode: {
        type: Sequelize.STRING
    },
    comments: {
        type: Sequelize.STRING
    },
});

module.exports = CustOrders;