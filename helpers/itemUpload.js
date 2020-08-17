const multer = require('multer');
const path = require('path');
const Item = require('../models/Item');

var i = 0;

const storage = multer.diskStorage({
    destination: (req, file, callback) => {
        callback(null, './public/uploads/item_pictures/');
    },
    filename: (req, file, callback) => {
        callback(null, i + path.extname(file.originalname));
        i=+1
    }
});
// Initialise Upload
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 1000000
    },
    fileFilter: (req, file, callback) => {
        checkFileType(file, callback);
    }
}).single('itemUpload'); // Must be the name as the HTML file upload input
// Check File Type
function checkFileType(file, callback) {
    const filetypes = /jpeg|jpg|png|gif/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
        return callback(null, true);
    } else {
        callback({ message: 'Images Only' });
    }
}
module.exports = upload;