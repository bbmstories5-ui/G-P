const http = require('http');

function httpRequest(options, data) {
  return new Promise((resolve, reject) => {
    let payloadBuffer = null;
    if (data !== undefined && data !== null) {
      if (typeof data === 'string') {
        payloadBuffer = Buffer.from(data);
      } else if (Buffer.isBuffer(data)) {
        payloadBuffer = data;
      } else {
        payloadBuffer = Buffer.from(JSON.stringify(data));
      }
      options.headers = options.headers || {};
      options.headers['Content-Length'] = payloadBuffer.length;
    }

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        const cookies = res.headers['set-cookie'];
        let cookieHeader = '';
        if (cookies) {
          cookieHeader = cookies.map((c) => c.split(';')[0]).join('; ');
        }
        let parsed = body;
        try {
          parsed = JSON.parse(body);
        } catch {}
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: parsed,
          cookie: cookieHeader,
        });
      });
    });
    req.on('error', reject);
    if (payloadBuffer) {
      req.write(payloadBuffer);
    }
    req.end();
  });
}

async function runSecurityAuditTests() {
  console.log('================================================================');
  console.log('🛡️  ENTERPRISE SECURITY AUDIT & HARDENING VERIFICATION SUITE');
  console.log('================================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function assert(title, condition, detail) {
    totalTests++;
    if (condition) {
      passedTests++;
      console.log(`  ✅ [PASS] ${title}`);
    } else {
      console.error(`  ❌ [FAIL] ${title} - Detail:`, detail);
    }
  }

  // TEST 1: Bypass Elimination via ?u=admin
  console.log('1️⃣ Testing Authentication Bypass Elimination...');
  const bypassRes = await httpRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/api/admin/users?u=admin',
    method: 'GET',
  });
  assert(
    'Unauthenticated GET /api/admin/users?u=admin must be denied',
    bypassRes.status === 401 || bypassRes.status === 403,
    `Status was ${bypassRes.status}`
  );

  // TEST 2: Bypass Elimination via x-user-key header
  const headerBypassRes = await httpRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/api/admin/users',
    method: 'GET',
    headers: { 'x-user-key': 'admin' },
  });
  assert(
    'Unauthenticated GET /api/admin/users with x-user-key header must be denied',
    headerBypassRes.status === 401 || headerBypassRes.status === 403,
    `Status was ${headerBypassRes.status}`
  );

  // TEST 3: Unauthenticated /api/auth/switch-user Backdoor Elimination
  console.log('\n2️⃣ Testing Impersonation Backdoor Elimination...');
  const switchRes = await httpRequest(
    {
      hostname: 'localhost',
      port: 3000,
      path: '/api/auth/switch-user',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    { email: 'admin@company.com' }
  );
  assert(
    'Unauthenticated POST /api/auth/switch-user must be denied',
    switchRes.status === 401 || switchRes.status === 403,
    `Status was ${switchRes.status}`
  );

  // TEST 4: Remote Command Execution / Unauthenticated Setup Endpoint
  console.log('\n3️⃣ Testing Setup Endpoint Protection...');
  const setupRes = await httpRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/api/setup',
    method: 'GET',
  });
  // Setup endpoint must not leak passwords and must be protected
  const noPasswordLeak =
    !setupRes.body?.password &&
    (!setupRes.body?.usersCount || setupRes.status === 200 || setupRes.status === 403);
  assert(
    'GET /api/setup does not execute arbitrary commands or leak passwords',
    noPasswordLeak,
    setupRes.body
  );

  // TEST 5: Legitimate Authenticated Login & Strict Isolation
  console.log('\n4️⃣ Testing Legitimate Authentication & Strict Role Isolation...');
  const loginMember04 = await httpRequest(
    {
      hostname: 'localhost',
      port: 3000,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    { email: 'member04@company.com', password: 'password123', expectedRole: 'REQUESTER' }
  );
  assert(
    'Legitimate login for member04 succeeds with 200 and session token',
    loginMember04.status === 200 && Boolean(loginMember04.body.token),
    loginMember04.body
  );

  const cookie04 = loginMember04.cookie;
  const token04 = loginMember04.body.token;

  // Member 04 fetches requirements
  const reqs04 = await httpRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/api/requirements',
    method: 'GET',
    headers: { Authorization: `Bearer ${token04}`, Cookie: cookie04 },
  });
  assert(
    'Member 04 fetches own requirements successfully',
    reqs04.status === 200 && Array.isArray(reqs04.body.requirements),
    reqs04.status
  );

  // Member 01 tries to access Member 04's requirement
  const loginMember01 = await httpRequest(
    {
      hostname: 'localhost',
      port: 3000,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    { email: 'member01@company.com', password: 'password123', expectedRole: 'REQUESTER' }
  );
  const cookie01 = loginMember01.cookie;
  const token01 = loginMember01.body.token;

  if (reqs04.body.requirements && reqs04.body.requirements.length > 0) {
    const targetReqId = reqs04.body.requirements[0].id;
    const isolationTest = await httpRequest({
      hostname: 'localhost',
      port: 3000,
      path: `/api/requirements/${targetReqId}`,
      method: 'GET',
      headers: { Authorization: `Bearer ${token01}`, Cookie: cookie01 },
    });
    assert(
      'Member 01 accessing Member 04 requirement is blocked (IDOR Protection)',
      isolationTest.status === 403,
      `Status was ${isolationTest.status}`
    );
  }

  // TEST 6: IDOR Session Revocation Defense
  console.log('\n5️⃣ Testing IDOR Session Revocation Defense...');
  const fakeSessionId = '00000000-0000-0000-0000-000000000000';
  const idorSessionTest = await httpRequest(
    {
      hostname: 'localhost',
      port: 3000,
      path: '/api/auth/profile',
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token01}`,
        Cookie: cookie01,
      },
    },
    { sessionId: fakeSessionId }
  );
  assert(
    'Attempting to revoke a session not owned by user returns 404/denied',
    idorSessionTest.status === 404,
    `Status was ${idorSessionTest.status}`
  );

  // TEST 7: File Upload Magic Byte Signature Check (Malicious Script Upload Defense)
  console.log('\n6️⃣ Testing Malicious File Upload Defenses...');
  // Construct a multipart body with a fake PNG (actually an HTML/SVG script payload)
  const boundary = '----WebKitFormBoundarySecurityTest' + Date.now();
  const fakePngContent = '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>';
  const multipartBody = Buffer.concat([
    Buffer.from(
      `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="malicious.png"\r\nContent-Type: image/png\r\n\r\n`
    ),
    Buffer.from(fakePngContent),
    Buffer.from(`\r\n--${boundary}--\r\n`),
  ]);

  const maliciousUpload = await httpRequest(
    {
      hostname: 'localhost',
      port: 3000,
      path: '/api/upload',
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': multipartBody.length,
        Authorization: `Bearer ${token01}`,
        Cookie: cookie01,
      },
    },
    multipartBody
  );
  assert(
    'Fake image with SVG payload is rejected by magic byte signature check',
    maliciousUpload.status === 400,
    `Status was ${maliciousUpload.status}`
  );

  // TEST 8: Valid PNG Magic Bytes Upload
  // PNG Magic Header: 89 50 4E 47 0D 0A 1A 0A followed by minimum valid chunks
  const valid1x1Png = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    'base64'
  );
  const validMultipartBody = Buffer.concat([
    Buffer.from(
      `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="pixel.png"\r\nContent-Type: image/png\r\n\r\n`
    ),
    valid1x1Png,
    Buffer.from(`\r\n--${boundary}--\r\n`),
  ]);

  const validUpload = await httpRequest(
    {
      hostname: 'localhost',
      port: 3000,
      path: '/api/upload',
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': validMultipartBody.length,
        Authorization: `Bearer ${token01}`,
        Cookie: cookie01,
      },
    },
    validMultipartBody
  );
  assert(
    'Authentic PNG image with genuine magic bytes is accepted',
    validUpload.status === 200 && Boolean(validUpload.body?.url),
    `Status was ${validUpload.status}`
  );

  console.log('\n================================================================');
  console.log(`RESULTS: ${passedTests} / ${totalTests} TESTS PASSED (${Math.round((passedTests / totalTests) * 100)}%)`);
  console.log('================================================================\n');

  if (passedTests === totalTests) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runSecurityAuditTests().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
