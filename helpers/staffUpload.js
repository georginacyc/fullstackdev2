const multer = require('multer');
const path = require('path');
const User = require('../models/User');

const storage = multer.diskStorage({
    destination: (req, file, callback) => {
        callback(null, './public/uploads/staff_pictures/');
    },
    filename: (req, file, callback) => {
        User.max('id')
        .then((c) => {
            c = parseInt(c) + 1
            callback(null, c.toString() + path.extname(file.originalname));
        })
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 1000000
    },
    fileFilter: (req, file, callback) => {
        checkFileType(file, callback);
    }
}).single('staffUpload')

function checkFileType(file, callback) {
    const filetypes = /jpeg|jpg|png/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
        return callback(null, true);
    } else {
        callback({message: 'Images Only. No GIFs.'})
    }
}

module.exports = upload;