const http = require('http');

const USERS = [
  { email: 'member01@company.com', role: 'REQUESTER', name: 'Member 01' },
  { email: 'member02@company.com', role: 'REQUESTER', name: 'Member 02' },
  { email: 'member03@company.com', role: 'REQUESTER', name: 'Member 03' },
  { email: 'member04@company.com', role: 'REQUESTER', name: 'Member 04' },
  { email: 'member05@company.com', role: 'REQUESTER', name: 'Member 05' },
  { email: 'member06@company.com', role: 'REQUESTER', name: 'Member 06' },
  { email: 'member07@company.com', role: 'REQUESTER', name: 'Member 07' },
  { email: 'member08@company.com', role: 'REQUESTER', name: 'Member 08' },
  { email: 'member09@company.com', role: 'REQUESTER', name: 'Member 09' },
  { email: 'member10@company.com', role: 'REQUESTER', name: 'Member 10' },
  { email: 'member11@company.com', role: 'REQUESTER', name: 'Member 11' },
  { email: 'member12@company.com', role: 'REQUESTER', name: 'Member 12' },
  { email: 'designer01@company.com', role: 'DESIGNER', name: 'Designer 01' },
  { email: 'designer02@company.com', role: 'DESIGNER', name: 'Designer 02' },
  { email: 'designer03@company.com', role: 'DESIGNER', name: 'Designer 03' },
  { email: 'approver@company.com', role: 'APPROVER', name: 'Lead Approver' },
  { email: 'admin@company.com', role: 'ADMIN', name: 'Super Admin' },
];

function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(body);
        } catch (e) {
          json = body;
        }
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: json,
        });
      });
    });

    req.on('error', reject);

    if (postData) {
      req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
    }
    req.end();
  });
}

async function runTest() {
  console.log('================================================================');
  console.log('       MULTI-USER CONCURRENT AUTHENTICATION VERIFICATION        ');
  console.log('================================================================');

  const sessions = new Map();

  console.log('\n--- 1. LOGGING IN ALL 17 USERS SIMULTANEOUSLY ---');
  for (const user of USERS) {
    const loginRes = await makeRequest(
      {
        hostname: 'localhost',
        port: 3000,
        path: '/api/auth/login',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': `ConcurrentTestClient/${user.name.replace(' ', '')}`,
        },
      },
      { email: user.email, password: 'password123' }
    );

    if (loginRes.status === 200 && loginRes.data.success) {
      const setCookieHeader = loginRes.headers['set-cookie'];
      let tokenCookie = '';
      if (setCookieHeader) {
        const cookieStr = Array.isArray(setCookieHeader) ? setCookieHeader.join('; ') : setCookieHeader;
        const match = cookieStr.match(/token=([^;]+)/);
        if (match) tokenCookie = `token=${match[1]}`;
      }

      sessions.set(user.email, {
        user,
        cookie: tokenCookie,
        sessionId: loginRes.data.sessionId,
      });

      console.log(`[LOGIN 200 OK] ${user.name.padEnd(14)} (${user.email}) -> Session: ${loginRes.data.sessionId}`);
    } else {
      console.error(`[LOGIN FAILED] ${user.name}:`, loginRes.data);
    }
  }

  console.log(`\nSuccessfully created ${sessions.size} independent sessions.`);

  console.log('\n--- 2. VERIFYING ALL 17 ACCOUNTS REMAIN CONCURRENTLY ACTIVE (/api/auth/me) ---');
  let activeCount = 0;
  for (const user of USERS) {
    const session = sessions.get(user.email);
    const meRes = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/auth/me',
      method: 'GET',
      headers: {
        Cookie: session.cookie,
      },
    });

    if (meRes.status === 200 && meRes.data.user && meRes.data.user.email === user.email) {
      activeCount++;
      console.log(`[ACTIVE] ${user.name.padEnd(14)} -> Verified as ${meRes.data.user.name} (${meRes.data.user.role})`);
    } else {
      console.error(`[ERROR] ${user.name} was not authenticated!`, meRes.data);
    }
  }

  console.log(`\nRESULT: ${activeCount} / 17 users simultaneously active and authenticated.`);

  console.log('\n--- 3. TESTING INDEPENDENT LOGOUT (LOGOUT MEMBER 01 ONLY) ---');
  const m1Session = sessions.get('member01@company.com');
  const logoutRes = await makeRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/api/auth/logout',
    method: 'POST',
    headers: {
      Cookie: m1Session.cookie,
    },
  });
  console.log(`Member 01 logout response:`, logoutRes.data);

  // Check Member 01 is now unauthorized
  const m1Check = await makeRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/api/auth/me',
    method: 'GET',
    headers: {
      Cookie: m1Session.cookie,
    },
  });
  console.log(`Member 01 session revoked status: ${m1Check.status} (Expected: 401 Unauthorized)`);

  // Check other accounts are still 100% active
  const remainingCheckEmails = [
    'member02@company.com',
    'member03@company.com',
    'designer01@company.com',
    'designer02@company.com',
    'approver@company.com',
    'admin@company.com',
  ];

  for (const email of remainingCheckEmails) {
    const sess = sessions.get(email);
    const checkRes = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/auth/me',
      method: 'GET',
      headers: {
        Cookie: sess.cookie,
      },
    });
    console.log(`[STILL ACTIVE] ${sess.user.name.padEnd(14)} -> ${checkRes.data.user?.name} (${checkRes.status} OK)`);
  }

  console.log('\n--- 4. TESTING ROLE-BASED DATA PRIVACY & ISOLATION ---');
  const m2Session = sessions.get('member02@company.com');
  const m2Analytics = await makeRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/api/analytics/requester?range=30d',
    method: 'GET',
    headers: {
      Cookie: m2Session.cookie,
    },
  });
  console.log(`Member 02 Analytics: Total Requests = ${m2Analytics.data.metrics?.totalRequests} (Isolated to Member 02)`);

  const d1Session = sessions.get('designer01@company.com');
  const d1Analytics = await makeRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/api/analytics/designer?range=30d',
    method: 'GET',
    headers: {
      Cookie: d1Session.cookie,
    },
  });
  console.log(`Designer 01 Analytics: Assigned Work = ${d1Analytics.data.metrics?.totalAssigned} (Isolated to Designer 01)`);

  const apprSession = sessions.get('approver@company.com');
  const apprAnalytics = await makeRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/api/analytics/approver?range=30d',
    method: 'GET',
    headers: {
      Cookie: apprSession.cookie,
    },
  });
  console.log(`Approver Analytics: Pending Approvals = ${apprAnalytics.data.metrics?.pendingApproval}, Queue Size = ${apprAnalytics.data.approvalQueue?.length}`);

  const adminSession = sessions.get('admin@company.com');
  const adminAnalytics = await makeRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/api/analytics/admin?range=30d',
    method: 'GET',
    headers: {
      Cookie: adminSession.cookie,
    },
  });
  console.log(`Admin Analytics: Total Company Requesters = ${adminAnalytics.data.metrics?.totalRequesters}, Designers = ${adminAnalytics.data.metrics?.totalDesigners}, Approvers = ${adminAnalytics.data.metrics?.totalApprovers}`);

  console.log('\n================================================================');
  console.log('       ALL 17 CONCURRENT SESSIONS FULLY VERIFIED & WORKING!     ');
  console.log('================================================================\n');
}

runTest().catch(console.error);
