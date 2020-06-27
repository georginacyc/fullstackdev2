//database model for stock order

const Sequelize = require('sequelize');
const db = require('../config/DBConfig');

const StockOrder = db.define('stockorder', {
    stcokorderDate: {
        type: Sequelize.DATE
    },
    shipmentStatus: {
        type: Sequelize.STRING
    },
    shipmentDate: {
        type: Sequelize.DATE
    },
    itemSerial: {
        type: Sequelize.STRING
    },
    stockorderQuantity: {
        type: Sequelize.INTEGER
    },
    receivedDate: {
        type: Sequelize.DATE
    },
});

module.exports = StockOrder;