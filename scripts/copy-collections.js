const fs = require('fs');
const path = require('path');

const src1 = 'C:\\Users\\BAPS\\Downloads\\Three Sponsor Logos on Transparency.png';
const dest1 = path.join(__dirname, '..', 'public', 'images', 'samples', 'three_sponsors.png');
if (fs.existsSync(src1)) fs.copyFileSync(src1, dest1);

const src2 = 'C:\\Users\\BAPS\\Downloads\\JITO Logo Collection on Transparent Background.png';
const dest2 = path.join(__dirname, '..', 'public', 'images', 'samples', 'jito_collection.png');
if (fs.existsSync(src2)) fs.copyFileSync(src2, dest2);

console.log('Copied sponsor & jito collection images');
