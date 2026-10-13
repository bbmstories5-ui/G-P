const fs = require('fs');
const path = require('path');

const dir = 'C:\\Users\\BAPS\\Downloads\\photo for pushpam';
if (fs.existsSync(dir)) {
  const files = fs.readdirSync(dir);
  console.log('Files in photo for pushpam:');
  files.forEach(f => {
    const s = fs.statSync(path.join(dir, f));
    console.log(` - ${f} (${s.size} bytes)`);
  });
}
