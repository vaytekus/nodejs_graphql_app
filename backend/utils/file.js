const fs = require('fs');
const path = require('path');

const clearImage = filePath => {
  // filePath is stored like "images/filename.jpg" in the DB
  const absolutePath = path.join(__dirname, '..', filePath);
  fs.unlink(absolutePath, err => {
    if (err) {
      console.log(err);
    }
  });
};

module.exports = clearImage;