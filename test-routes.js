const http = require('http');

const routes = [
  '/',
  '/login',
  '/login/requester',
  '/login/designer',
  '/login/approver',
  '/login/admin',
  '/videos/login-animation.mp4',
  '/videos/forgot-password.mp4',
];

async function checkRoute(path) {
  return new Promise((resolve) => {
    http.get(`http://localhost:3000${path}`, (res) => {
      console.log(`Path: ${path.padEnd(30)} -> HTTP Status: ${res.statusCode} (${res.statusMessage})`);
      resolve(res.statusCode);
    }).on('error', (e) => {
      console.error(`Error on ${path}:`, e.message);
      resolve(500);
    });
  });
}

async function run() {
  console.log('Testing all login routes & video assets...');
  for (const r of routes) {
    await checkRoute(r);
  }
}

run();
