//database model for stock order

const Sequelize = require('sequelize');
const db = require('../config/DBConfig');

const StockOrder = db.define('stockorder', {
    stockorderDate: {
        type: Sequelize.DATEONLY
    },
    shipmentStatus: {
        type: Sequelize.STRING,
        defaultValue: 'Processing'
    },
    shipmentDate: {
        type: Sequelize.DATEONLY
    },
    itemSerial: {
        type: Sequelize.STRING
    },
    stockorderQuantity: {
        type: Sequelize.INTEGER
    },
    receivedDate: {
        type: Sequelize.DATEONLY
    },
});

module.exports = StockOrder;