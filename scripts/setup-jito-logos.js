const fs = require('fs');
const path = require('path');

const sourceDir = 'C:\\Users\\BAPS\\Downloads\\Six_Separate_Transparent_Logos';
const destDir = path.join(__dirname, '..', 'public', 'logos', 'jito');

if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

const files = fs.readdirSync(sourceDir);
console.log('Copying JITO logo files:');
files.forEach(f => {
  const src = path.join(sourceDir, f);
  const dest = path.join(destDir, f);
  fs.copyFileSync(src, dest);
  const stat = fs.statSync(dest);
  console.log(`Copied: ${f} -> ${dest} (${stat.size} bytes)`);
});
