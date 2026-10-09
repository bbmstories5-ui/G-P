const http = require('http');

const BASE_URL = 'http://localhost:3000';

function request({ method, path, headers = {}, body = null }) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const data = body ? (typeof body === 'string' ? body : JSON.stringify(body)) : null;

    const reqHeaders = {
      ...headers,
    };
    if (data) {
      reqHeaders['Content-Type'] = 'application/json';
      reqHeaders['Content-Length'] = Buffer.byteLength(data);
    }

    const req = http.request(
      {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname + url.search,
        method,
        headers: reqHeaders,
      },
      (res) => {
        let resData = '';
        res.on('data', (chunk) => (resData += chunk));
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
      }
    );

    req.on('error', (e) => reject(e));
    if (data) req.write(data);
    req.end();
  });
}

async function runTabAuthTests() {
  console.log('========================================================================');
  console.log('STARTING SAME-BROWSER MULTI-TAB INDEPENDENT AUTHENTICATION TEST SUITE');
  console.log('========================================================================\n');

  const tabs = [
    { name: 'Tab 1 (Approver)', tabId: 'TAB-1-APPROVER', email: 'approver@company.com', expectedRole: 'APPROVER' },
    { name: 'Tab 2 (Member 01)', tabId: 'TAB-2-MEMBER01', email: 'member01@company.com', expectedRole: 'REQUESTER' },
    { name: 'Tab 3 (Member 02)', tabId: 'TAB-3-MEMBER02', email: 'member02@company.com', expectedRole: 'REQUESTER' },
    { name: 'Tab 4 (Designer 01)', tabId: 'TAB-4-DESIGNER01', email: 'designer01@company.com', expectedRole: 'DESIGNER' },
    { name: 'Tab 5 (Designer 02)', tabId: 'TAB-5-DESIGNER02', email: 'designer02@company.com', expectedRole: 'DESIGNER' },
    { name: 'Tab 6 (Member 03)', tabId: 'TAB-6-MEMBER03', email: 'member03@company.com', expectedRole: 'REQUESTER' },
  ];

  const tabState = {};

  // STEP 1: Log in each tab sequentially in the SAME browser
  console.log('▶ STEP 1: Logging into 6 different accounts across 6 tabs in the SAME browser...');
  for (const t of tabs) {
    const loginRes = await request({
      method: 'POST',
      path: '/api/auth/login',
      headers: {
        'x-tab-session-id': t.tabId,
      },
      body: {
        email: t.email,
        password: 'password123',
        tabSessionId: t.tabId,
      },
    });

    if (loginRes.status !== 200 || !loginRes.data.success || !loginRes.data.token) {
      throw new Error(`Login failed for ${t.name}: ` + JSON.stringify(loginRes.data));
    }

    tabState[t.tabId] = {
      ...t,
      token: loginRes.data.token,
      sessionId: loginRes.data.sessionId,
      user: loginRes.data.user,
    };

    console.log(`  ✔ ${t.name} logged in. User: ${loginRes.data.user.name} (${loginRes.data.user.role}) | tabId: ${t.tabId}`);
  }

  // STEP 2: Verify each tab independently upon Page Refresh
  console.log('\n▶ STEP 2: Verifying Page Reload on all 6 tabs...');
  for (const t of tabs) {
    const tabData = tabState[t.tabId];
    const meRes = await request({
      method: 'GET',
      path: '/api/auth/me',
      headers: {
        Authorization: `Bearer ${tabData.token}`,
        'x-tab-session-id': t.tabId,
        'x-tab-token': tabData.token,
      },
    });

    if (meRes.status !== 200 || !meRes.data.authenticated || meRes.data.user?.email !== t.email) {
      throw new Error(`Tab reload failed for ${t.name}! Expected ${t.email}, got: ` + JSON.stringify(meRes.data));
    }

    console.log(`  ✔ [PAGE RELOAD SUCCESS] ${t.name} retains exact account: ${meRes.data.user.name} (${meRes.data.user.role})`);
  }

  // STEP 3: Cross-Tab Isolation Test when a new user logs in Tab 7
  console.log('\n▶ STEP 3: Cross-Tab Isolation Check — Logging in Tab 7 (Member 04)...');
  const tab7Login = await request({
    method: 'POST',
    path: '/api/auth/login',
    headers: { 'x-tab-session-id': 'TAB-7-MEMBER04' },
    body: { email: 'member04@company.com', password: 'password123', tabSessionId: 'TAB-7-MEMBER04' },
  });
  console.log(`  Tab 7 Login Status: ${tab7Login.status} (${tab7Login.data.user?.name})`);

  console.log('  Re-verifying all original 6 tabs after Tab 7 login...');
  for (const t of tabs) {
    const tabData = tabState[t.tabId];
    const meRes = await request({
      method: 'GET',
      path: '/api/auth/me',
      headers: {
        Authorization: `Bearer ${tabData.token}`,
        'x-tab-session-id': t.tabId,
      },
    });

    if (meRes.status !== 200 || meRes.data.user?.email !== t.email) {
      throw new Error(`Cross-tab interference detected in ${t.name}! Expected ${t.email}, got ${meRes.data.user?.email}`);
    }
  }
  console.log('  ✔ All 6 tabs remain completely unaffected by Tab 7 login!');

  // STEP 4: Tab-Specific Logout Isolation Test
  console.log('\n▶ STEP 4: Tab-Specific Logout Isolation Test...');
  console.log('  Logging out Tab 2 (Member 01)...');
  const tab2Data = tabState['TAB-2-MEMBER01'];
  const logoutTab2 = await request({
    method: 'POST',
    path: '/api/auth/logout',
    headers: {
      Authorization: `Bearer ${tab2Data.token}`,
      'x-tab-session-id': 'TAB-2-MEMBER01',
      'x-tab-token': tab2Data.token,
    },
  });
  console.log(`  Tab 2 logout response: ${logoutTab2.status}`);

  // Check Tab 2 is logged out
  const tab2Check = await request({
    method: 'GET',
    path: '/api/auth/me',
    headers: {
      Authorization: `Bearer ${tab2Data.token}`,
      'x-tab-session-id': 'TAB-2-MEMBER01',
    },
  });
  console.log(`  Tab 2 status after logout: ${tab2Check.status} (Expected 401)`);
  if (tab2Check.status !== 401) throw new Error('Tab 2 was not logged out!');

  // Check all other tabs (Tab 1, 3, 4, 5, 6) remain logged in
  const remainingTabs = tabs.filter((t) => t.tabId !== 'TAB-2-MEMBER01');
  console.log('  Verifying remaining 5 tabs remain logged in...');
  for (const t of remainingTabs) {
    const tabData = tabState[t.tabId];
    const checkRes = await request({
      method: 'GET',
      path: '/api/auth/me',
      headers: {
        Authorization: `Bearer ${tabData.token}`,
        'x-tab-session-id': t.tabId,
      },
    });
    if (checkRes.status !== 200 || checkRes.data.user?.email !== t.email) {
      throw new Error(`Unrelated tab ${t.name} was accidentally logged out!`);
    }
    console.log(`  ✔ ${t.name} is STILL LOGGED IN as ${checkRes.data.user.name}`);
  }

  // STEP 5: Hard Refresh on Tab 1 (Approver)
  console.log('\n▶ STEP 5: Hard Refresh Verification on Tab 1 (Approver)...');
  const approverData = tabState['TAB-1-APPROVER'];
  const approverCheck = await request({
    method: 'GET',
    path: '/api/auth/me',
    headers: {
      Authorization: `Bearer ${approverData.token}`,
      'x-tab-session-id': 'TAB-1-APPROVER',
    },
  });
  if (approverCheck.status === 200 && approverCheck.data.user?.role === 'APPROVER') {
    console.log(`  ✔ Approver in Tab 1 remains APPROVER (${approverCheck.data.user.name}) after hard refresh!`);
  } else {
    throw new Error('Approver lost session on hard refresh!');
  }

  console.log('\n========================================================================');
  console.log('ALL 5 MULTI-TAB SAME-BROWSER TEST SUITES PASSED WITH 100% SUCCESS!');
  console.log('========================================================================\n');
}

runTabAuthTests().catch((err) => {
  console.error('FATAL TEST ERROR:', err);
  process.exit(1);
});
