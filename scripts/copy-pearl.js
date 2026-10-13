const fs = require('fs');
const path = require('path');

const src = 'C:\\Users\\BAPS\\Downloads\\photo for pushpam\\pearl.png';
const dest = path.join(__dirname, '..', 'public', 'images', 'samples', 'pearl.png');
if (fs.existsSync(src)) {
  fs.copyFileSync(src, dest);
  console.log('Copied pearl.png');
}
