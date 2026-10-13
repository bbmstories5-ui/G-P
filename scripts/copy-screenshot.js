const fs = require('fs');
const path = require('path');

const src1 = 'C:\\Users\\BAPS\\Downloads\\Screenshot 2026-09-26 150956.png';
const dest1 = path.join(__dirname, '..', 'public', 'images', 'samples', 'screenshot_sep26.png');
if (fs.existsSync(src1)) fs.copyFileSync(src1, dest1);

const src2 = 'C:\\Users\\BAPS\\Downloads\\image.png';
const dest2 = path.join(__dirname, '..', 'public', 'images', 'samples', 'image_sample.png');
if (fs.existsSync(src2)) fs.copyFileSync(src2, dest2);

console.log('Copied screenshots to samples');
