const multer = require("multer");
const path = require("node:path");

//DONE Configuration to save images in a specific path

const storage = multer.diskStorage({
  destination: function (cb) {
    const route = path.join(__dirname, "..", "public", "images");
    cd(null, route);
  },
  filename: function (file, cd) {
    const filename = file.fieldname + "-" + Date.now() + file.originalname;
    cb(null, filename);
  },
});

const upload = multer({ storage: storage });

module.exports = upload;
