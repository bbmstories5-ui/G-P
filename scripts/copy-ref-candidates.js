const fs = require('fs');
const path = require('path');

const src1 = 'C:\\Users\\BAPS\\Downloads\\ChatGPT Image Oct 9, 2026, 10_29_23 AM.png';
const dest1 = path.join(__dirname, '..', 'public', 'images', 'samples', 'chatgpt_ref_oct9.png');
if (fs.existsSync(src1)) {
  fs.copyFileSync(src1, dest1);
  console.log('Copied chatgpt_ref_oct9.png');
}

const src2 = 'C:\\Users\\BAPS\\Downloads\\Screenshot_2.png';
const dest2 = path.join(__dirname, '..', 'public', 'images', 'samples', 'screenshot_2.png');
if (fs.existsSync(src2)) {
  fs.copyFileSync(src2, dest2);
  console.log('Copied screenshot_2.png');
}
