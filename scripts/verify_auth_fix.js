const http = require('http');

const BASE_URL = 'http://localhost:3000';

function makeRequest({ method, path, headers = {}, body = null }) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      headers: {
        ...headers,
      },
    };

    if (body) {
      const data = typeof body === 'string' ? body : JSON.stringify(body);
      options.headers['Content-Type'] = 'application/json';
      options.headers['Content-Length'] = Buffer.byteLength(data);
    }

    const req = http.request(options, (res) => {
      let resData = '';
      res.on('data', (chunk) => {
        resData += chunk;
      });
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(resData);
        } catch {}
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: json || resData,
        });
      });
    });

    req.on('error', (e) => reject(e));
    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
}

function extractCookies(setCookieHeader) {
  if (!setCookieHeader) return {};
  const cookies = {};
  const array = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader];
  for (const c of array) {
    const match = c.match(/^([^=]+)=([^;]+)/);
    if (match) {
      cookies[match[1]] = match[2];
    }
  }
  return cookies;
}

function cookieObjectToString(cookieObj) {
  return Object.entries(cookieObj)
    .map(([k, v]) => `${k}=${v}`)
    .join('; ');
}

async function runTest() {
  console.log('===============================================================');
  console.log('STARTING CRITICAL AUTHENTICATION & PAGE-RELOAD VERIFICATION');
  console.log('===============================================================\n');

  // 1. Browser 1: Approver Login
  console.log('▶ STEP 1: Browser 1 — Approver Login (approver@company.com)...');
  const approverLogin = await makeRequest({
    method: 'POST',
    path: '/api/auth/login',
    body: { email: 'approver@company.com', password: 'password123' },
  });
  if (approverLogin.status !== 200 || !approverLogin.data.success) {
    throw new Error('Approver login failed: ' + JSON.stringify(approverLogin.data));
  }
  const approverCookies = extractCookies(approverLogin.headers['set-cookie']);
  console.log('  ✔ Approver logged in successfully. Role:', approverLogin.data.user.role);

  // 2. Browser 2: Member 01 Login
  console.log('▶ STEP 2: Browser 2 — Member 01 Login (member01@company.com)...');
  const member01Login = await makeRequest({
    method: 'POST',
    path: '/api/auth/login',
    body: { email: 'member01@company.com', password: 'password123' },
  });
  if (member01Login.status !== 200 || !member01Login.data.success) {
    throw new Error('Member 01 login failed: ' + JSON.stringify(member01Login.data));
  }
  const member01Cookies = extractCookies(member01Login.headers['set-cookie']);
  console.log('  ✔ Member 01 logged in successfully. Role:', member01Login.data.user.role);

  // 3. Browser 3: Designer 01 Login
  console.log('▶ STEP 3: Browser 3 — Designer 01 Login (designer01@company.com)...');
  const designer01Login = await makeRequest({
    method: 'POST',
    path: '/api/auth/login',
    body: { email: 'designer01@company.com', password: 'password123' },
  });
  if (designer01Login.status !== 200 || !designer01Login.data.success) {
    throw new Error('Designer 01 login failed: ' + JSON.stringify(designer01Login.data));
  }
  const designer01Cookies = extractCookies(designer01Login.headers['set-cookie']);
  console.log('  ✔ Designer 01 logged in successfully. Role:', designer01Login.data.user.role);

  // 4. TEST PAGE RELOADS:
  console.log('\n▶ STEP 4: Page Reload Verification for Browser 1 (Approver)...');
  const approverRefresh = await makeRequest({
    method: 'GET',
    path: '/approver/dashboard',
    headers: { Cookie: cookieObjectToString(approverCookies) },
  });
  console.log(`  Approver page reload status: ${approverRefresh.status} (Expected 200)`);
  if (approverRefresh.status !== 200) throw new Error('Approver dashboard returned non-200 on refresh!');

  const approverMe = await makeRequest({
    method: 'GET',
    path: '/api/auth/me?role=APPROVER',
    headers: { Cookie: cookieObjectToString(approverCookies) },
  });
  if (approverMe.status !== 200 || approverMe.data.user.email !== 'approver@company.com') {
    throw new Error('Approver auth verification failed on reload!');
  }
  console.log(`  ✔ Approver remains AUTHENTICATED on reload (${approverMe.data.user.name})`);

  console.log('\n▶ STEP 5: Page Reload Verification for Browser 2 (Member 01)...');
  const member01Refresh = await makeRequest({
    method: 'GET',
    path: '/requester/dashboard',
    headers: { Cookie: cookieObjectToString(member01Cookies) },
  });
  console.log(`  Member 01 page reload status: ${member01Refresh.status} (Expected 200)`);
  if (member01Refresh.status !== 200) throw new Error('Member 01 dashboard returned non-200 on refresh!');

  const member01Me = await makeRequest({
    method: 'GET',
    path: '/api/auth/me?role=REQUESTER',
    headers: { Cookie: cookieObjectToString(member01Cookies) },
  });
  if (member01Me.status !== 200 || member01Me.data.user.email !== 'member01@company.com') {
    throw new Error('Member 01 auth verification failed on reload!');
  }
  console.log(`  ✔ Member 01 remains AUTHENTICATED on reload (${member01Me.data.user.name})`);

  console.log('\n▶ STEP 6: Page Reload Verification for Browser 3 (Designer 01)...');
  const designer01Refresh = await makeRequest({
    method: 'GET',
    path: '/designer/dashboard',
    headers: { Cookie: cookieObjectToString(designer01Cookies) },
  });
  console.log(`  Designer 01 page reload status: ${designer01Refresh.status} (Expected 200)`);
  if (designer01Refresh.status !== 200) throw new Error('Designer 01 dashboard returned non-200 on refresh!');

  const designer01Me = await makeRequest({
    method: 'GET',
    path: '/api/auth/me?role=DESIGNER',
    headers: { Cookie: cookieObjectToString(designer01Cookies) },
  });
  if (designer01Me.status !== 200 || designer01Me.data.user.email !== 'designer01@company.com') {
    throw new Error('Designer 01 auth verification failed on reload!');
  }
  console.log(`  ✔ Designer 01 remains AUTHENTICATED on reload (${designer01Me.data.user.name})`);

  // 7. Test All 17 Accounts Concurrently
  console.log('\n▶ STEP 7: Testing All 17 Accounts Logged In Simultaneously...');
  const allAccounts = [
    'admin@company.com',
    'approver@company.com',
    'designer01@company.com',
    'designer02@company.com',
    'designer03@company.com',
    'member01@company.com',
    'member02@company.com',
    'member03@company.com',
    'member04@company.com',
    'member05@company.com',
    'member06@company.com',
    'member07@company.com',
    'member08@company.com',
    'member09@company.com',
    'member10@company.com',
    'member11@company.com',
    'member12@company.com',
  ];

  const sessions = {};
  for (const email of allAccounts) {
    const loginRes = await makeRequest({
      method: 'POST',
      path: '/api/auth/login',
      body: { email, password: 'password123' },
    });
    if (loginRes.status !== 200) {
      throw new Error(`Login failed for ${email}`);
    }
    sessions[email] = {
      user: loginRes.data.user,
      cookies: extractCookies(loginRes.headers['set-cookie']),
    };
  }

  console.log('  All 17 accounts logged in. Validating concurrent requests & reload verification for each...');
  let activeCount = 0;
  for (const email of allAccounts) {
    const session = sessions[email];
    const meRes = await makeRequest({
      method: 'GET',
      path: '/api/auth/me',
      headers: { Cookie: cookieObjectToString(session.cookies) },
    });
    if (meRes.status === 200 && meRes.data.user?.email === email) {
      activeCount++;
    } else {
      console.error(`  ✖ Session invalidated for ${email}! Status: ${meRes.status}`);
    }
  }

  console.log(`  ✔ Concurrency Result: ${activeCount} / 17 users simultaneously active and authenticated!`);
  if (activeCount !== 17) throw new Error('Not all 17 accounts remained authenticated!');

  // 8. Test Single-Session Logout Isolation
  console.log('\n▶ STEP 8: Single-Session Logout Isolation Test...');
  console.log('  Logging out Designer 02 (designer02@company.com)...');
  const logoutRes = await makeRequest({
    method: 'POST',
    path: '/api/auth/logout',
    headers: { Cookie: cookieObjectToString(sessions['designer02@company.com'].cookies) },
  });
  console.log('  Logout response status:', logoutRes.status);

  // Check Designer 02 is logged out
  const designer02Check = await makeRequest({
    method: 'GET',
    path: '/api/auth/me',
    headers: { Cookie: cookieObjectToString(sessions['designer02@company.com'].cookies) },
  });
  console.log(`  Designer 02 auth status after logout: ${designer02Check.status} (Expected 401)`);
  if (designer02Check.status !== 401) throw new Error('Designer 02 was not logged out properly!');

  // Verify Approver and Member 01 are STILL logged in and unaffected
  const approverRecheck = await makeRequest({
    method: 'GET',
    path: '/api/auth/me',
    headers: { Cookie: cookieObjectToString(sessions['approver@company.com'].cookies) },
  });
  const member01Recheck = await makeRequest({
    method: 'GET',
    path: '/api/auth/me',
    headers: { Cookie: cookieObjectToString(sessions['member01@company.com'].cookies) },
  });

  if (approverRecheck.status === 200 && member01Recheck.status === 200) {
    console.log('  ✔ Approver and Member 01 remain 100% authenticated after Designer 02 logout!');
  } else {
    throw new Error('Unrelated users were logged out when Designer 02 logged out!');
  }

  console.log('\n===============================================================');
  console.log('ALL TESTS PASSED WITH 100% SUCCESS!');
  console.log('===============================================================\n');
}

runTest().catch((err) => {
  console.error('FATAL TEST FAILURE:', err);
  process.exit(1);
});
