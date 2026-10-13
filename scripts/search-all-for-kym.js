const fs = require('fs');
const path = require('path');

function searchDir(dir, depth = 0) {
  if (depth > 3) return;
  try {
    const list = fs.readdirSync(dir);
    for (const item of list) {
      if (item === 'node_modules' || item === '.git' || item === '.next') continue;
      const full = path.join(dir, item);
      let stat;
      try { stat = fs.statSync(full); } catch(e) { continue; }
      if (stat.isDirectory()) {
        searchDir(full, depth + 1);
      } else {
        const lower = item.toLowerCase();
        if (lower.includes('kym') || lower.includes('pearl') || lower.includes('jbn') || lower.includes('pagariya') || lower.includes('bonica') || (lower.includes('jito') && !lower.includes('logo'))) {
          console.log(`Found match: ${full} (${stat.size} bytes)`);
        }
      }
    }
  } catch(e) {}
}

console.log('Searching Desktop & projects...');
searchDir('C:\\Users\\BAPS\\Desktop');
searchDir('C:\\Users\\BAPS\\Downloads');
