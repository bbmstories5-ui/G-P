const fs = require('fs');
const path = require('path');

const downloads = 'C:\\Users\\BAPS\\Downloads';
const samplesDir = path.join(__dirname, '..', 'public', 'images', 'samples');

const filesToCopy = [
  'WhatsApp Image 2026-05-26 at 2.21.14 PM.jpeg',
  'WhatsApp Image 2026-05-26 at 2.28.55 PM.jpeg',
  'WhatsApp Image 2026-05-26 at 2.29.14 PM.jpeg',
  'dr-ketan-patel-hero (1).png',
  'dr-ketan-patel-hero.png'
];

filesToCopy.forEach(f => {
  const src = path.join(downloads, f);
  if (fs.existsSync(src)) {
    const safeName = f.replace(/[^a-zA-Z0-9._-]/g, '_');
    fs.copyFileSync(src, path.join(samplesDir, safeName));
    console.log(`Copied ${f} -> ${safeName}`);
  }
});
