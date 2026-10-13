const fs = require('fs');
const path = require('path');

const userHome = 'C:\\Users\\BAPS';
const searchWords = ['convener', 'secretary', 'chairman', 'jbn pearl', 'know your member'];

function scan(dir, depth = 0) {
  if (depth > 2) return;
  try {
    const list = fs.readdirSync(dir);
    for (const f of list) {
      const full = path.join(dir, f);
      let s;
      try { s = fs.statSync(full); } catch(e) { continue; }
      if (s.isDirectory() && !['node_modules', '.git', '.next', 'AppData'].includes(f)) {
        scan(full, depth + 1);
      } else if (f.endsWith('.txt') || f.endsWith('.json') || f.endsWith('.docx') || f.endsWith('.md')) {
        try {
          const content = fs.readFileSync(full, 'utf8');
          for (const w of searchWords) {
            if (content.toLowerCase().includes(w)) {
              console.log(`Found "${w}" in: ${full}`);
              break;
            }
          }
        } catch(e) {}
      }
    }
  } catch(e) {}
}

scan('C:\\Users\\BAPS\\Desktop');
scan('C:\\Users\\BAPS\\Downloads');
console.log('Done scanning text files.');
