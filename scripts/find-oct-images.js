const fs = require('fs');
const path = require('path');

const userHome = 'C:\\Users\\BAPS';
const targetFolders = ['Downloads', 'Documents', 'Pictures', 'Desktop'];

console.log('Searching for recent images in user profile:');
for (const folder of targetFolders) {
  const fullPath = path.join(userHome, folder);
  if (!fs.existsSync(fullPath)) continue;
  try {
    const files = fs.readdirSync(fullPath);
    files.forEach(f => {
      const ext = path.extname(f).toLowerCase();
      if (['.png', '.jpg', '.jpeg', '.webp'].includes(ext)) {
        const filePath = path.join(fullPath, f);
        const stat = fs.statSync(filePath);
        // Look for files modified in Oct 2026 or with creative/kym/jito/jbn in name
        const lower = f.toLowerCase();
        if (stat.mtime.getFullYear() === 2026 && (stat.mtime.getMonth() >= 8 || lower.includes('jito') || lower.includes('kym') || lower.includes('pearl') || lower.includes('referral') || lower.includes('creative'))) {
          console.log(`[${folder}] ${f} (${stat.size} bytes, ${stat.mtime})`);
        }
      }
    });
  } catch (e) {
    console.error(`Error reading ${folder}:`, e.message);
  }
}
