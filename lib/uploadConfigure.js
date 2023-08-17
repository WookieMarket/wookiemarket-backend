const multer = require('multer');
const path = require('node:path');

//Upload configuration
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const ruta = path.join(__dirname, '..', 'uploads');
        cb(null, ruta);
    },
    filename: function (res, file, cb) {
        const filename =
            file.fieldname + '-' + Date.now() + '-' + file.originalname;
        cb(null, filename);
    },
});

module.exports = multer({ storage });
