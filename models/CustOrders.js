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
    total_Amt: {
        type: Sequelize.INTEGER(3)
    },
    couponCode: {
        type: Sequelize.STRING
    },
    status: {
        type: Sequelize.STRING
    },
    order_Date: {
        type: Sequelize.DATE
    },
    ship_Date: {
        type: Sequelize.DATE
    },
    paid_Date: {
        type: Sequelize.DATE
    },
    completion_Date: {
        type: Sequelize.DATE
    },

});

module.exports = CustOrders;