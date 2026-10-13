const fs = require('fs');
const path = require('path');

const dir = 'C:\\Users\\BAPS\\Downloads\\Six_Separate_Transparent_Logos';
try {
  const files = fs.readdirSync(dir);
  console.log('Files in Six_Separate_Transparent_Logos:');
  files.forEach(f => {
    const stat = fs.statSync(path.join(dir, f));
    console.log(` - ${f} (${stat.size} bytes)`);
  });
} catch (e) {
  console.error(e.message);
}

// Also check if there is an image of a creative or flyer in Downloads or Desktop
const checkDirs = ['C:\\Users\\BAPS\\Downloads', 'C:\\Users\\BAPS\\Desktop'];
for (const d of checkDirs) {
  try {
    const allFiles = fs.readdirSync(d).filter(f => /\.(png|jpg|jpeg|webp)$/i.test(f));
    console.log(`\nImages in ${d}:`, allFiles);
  } catch (e) {}
}
