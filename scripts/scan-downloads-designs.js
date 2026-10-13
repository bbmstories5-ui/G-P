const fs = require('fs');
const path = require('path');

const downloads = 'C:\\Users\\BAPS\\Downloads';
const files = fs.readdirSync(downloads).filter(f => /\.(png|jpg|jpeg)$/i.test(f));

console.log('Scanning all image files in Downloads:');
files.forEach(f => {
  const p = path.join(downloads, f);
  const s = fs.statSync(p);
  // Check if modified recently or large enough to be a full design
  if (s.size > 150000 && s.mtime.getFullYear() === 2026) {
    console.log(`${f} (${s.size} bytes, ${s.mtime.toLocaleDateString()})`);
  }
});
