const { execSync } = require('child_process');

console.log('Finding and stopping process on port 3000...');
try {
  const out = execSync('netstat -ano | findstr :3000', { encoding: 'utf8' });
  const lines = out.trim().split('\n');
  for (const line of lines) {
    const parts = line.trim().split(/\s+/);
    const pid = parts[parts.length - 1];
    if (pid && !isNaN(pid) && pid !== '0') {
      try {
        console.log(`Killing PID ${pid}`);
        execSync(`taskkill /F /PID ${pid}`, { stdio: 'ignore' });
      } catch (e) {}
    }
  }
} catch (e) {}

console.log('Running npx prisma db push...');
try {
  const pushOut = execSync('npx prisma db push', { encoding: 'utf8' });
  console.log(pushOut);
} catch (e) {
  console.error('db push error:', e.stdout || e.message);
}

console.log('Running npx prisma generate...');
try {
  const genOut = execSync('npx prisma generate', { encoding: 'utf8' });
  console.log(genOut);
} catch (e) {
  console.error('prisma generate error:', e.stdout || e.message);
}
