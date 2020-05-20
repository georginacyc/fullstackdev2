const mySQLDB = require('./DBConfig');
const staff = require('../models/Staff');

const setUpDB = (drop) => {
    mySQLDB.authenticate()
    .then(() => {
        console.log('Monoqlo database connected');
    })
    .then(() => {
        mySQLDB.sync({
            force: drop
        }).then(() => {
            console.log('Create tables if none exists')
        }).catch(err => console.log(err))
    })
    .catch(err => console.log('Error: ' + err))
};

module.exports = {setUpDB};