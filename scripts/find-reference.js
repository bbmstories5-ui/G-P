const fs = require('fs');
const path = require('path');

const dir = 'C:\\Users\\BAPS\\Downloads';
const files = fs.readdirSync(dir).filter(f => f.startsWith('WhatsApp Image') || f.includes('Untitled') || f.includes('preview') || f.includes('JITO'));
console.log('Candidate reference files:');
files.forEach(f => {
  const stat = fs.statSync(path.join(dir, f));
  console.log(`${f} (${stat.size} bytes, modified: ${stat.mtime})`);
});
