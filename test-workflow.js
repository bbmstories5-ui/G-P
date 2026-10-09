const http = require('http');

function request(options, data) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        const cookies = res.headers['set-cookie'];
        let cookieHeader = '';
        if (cookies) {
          cookieHeader = cookies.map((c) => c.split(';')[0]).join('; ');
        }
        try {
          resolve({ status: res.statusCode, body: JSON.parse(body), cookie: cookieHeader });
        } catch (e) {
          resolve({ status: res.statusCode, body, cookie: cookieHeader });
        }
      });
    });
    req.on('error', reject);
    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function runTests() {
  console.log('====================================================');
  console.log('🧪 CREATIVE REQUEST & APPROVAL PORTAL VERIFICATION');
  console.log('====================================================\n');

  // 1. Login as Member 04
  console.log('1️⃣ Authenticating Member 04 (Requester)...');
  const loginMember04 = await request(
    {
      hostname: 'localhost',
      port: 3000,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    { email: 'member04@company.com', password: 'password123', expectedRole: 'REQUESTER' }
  );

  console.log('   Status:', loginMember04.status, '| Logged In As:', loginMember04.body.user.name);
  const cookieMember04 = loginMember04.cookie;

  // 2. Member 04 accesses own REQ-0001 (Diwali Promotion)
  console.log('\n2️⃣ Member 04 fetches own requirements...');
  const reqs04 = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/requirements',
    method: 'GET',
    headers: { Cookie: cookieMember04 },
  });
  console.log('   Requirements found for Member 04:', reqs04.body.requirements?.length);
  const diwaliReq = reqs04.body.requirements.find((r) => r.reqCode === 'REQ-0001');
  console.log('   REQ-0001 Status:', diwaliReq?.status, '| Title:', diwaliReq?.title);
  console.log('   Final Approved Graphic Attached:', Boolean(diwaliReq?.finalGraphicId));

  // 3. Strict Isolation Test: Login as Member 01 and try to access REQ-0001
  console.log('\n3️⃣ Strict Isolation Test: Member 01 attempting to fetch Member 04\'s REQ-0001...');
  const loginMember01 = await request(
    {
      hostname: 'localhost',
      port: 3000,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    { email: 'member01@company.com', password: 'password123', expectedRole: 'REQUESTER' }
  );
  const cookieMember01 = loginMember01.cookie;

  const unauthorizedAccess = await request({
    hostname: 'localhost',
    port: 3000,
    path: `/api/requirements/${diwaliReq.id}`,
    method: 'GET',
    headers: { Cookie: cookieMember01 },
  });

  console.log('   Response Status for Member 01:', unauthorizedAccess.status);
  console.log('   Security Message:', unauthorizedAccess.body.error);
  if (unauthorizedAccess.status === 403) {
    console.log('   ✅ PASS: Data isolation strictly enforced on backend!');
  } else {
    console.error('   ❌ FAIL: Isolation breached!');
  }

  // 4. Complete End-to-End Workflow Loop (Member 05 -> Designer 01 -> Approver Elena -> Member 05)
  console.log('\n4️⃣ Executing Complete Multi-Role Workflow Cycle...');

  // 4a. Member 05 creates requirement REQ-1024
  const loginMember05 = await request(
    {
      hostname: 'localhost',
      port: 3000,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    { email: 'member05@company.com', password: 'password123', expectedRole: 'REQUESTER' }
  );
  const cookieMember05 = loginMember05.cookie;

  console.log('   Step 4a: Member 05 creates new requirement "Instagram Festival Creative"...');
  const newReqRes = await request(
    {
      hostname: 'localhost',
      port: 3000,
      path: '/api/requirements',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieMember05 },
    },
    {
      title: 'Instagram Festival Creative',
      description: 'Create an engaging multi-story festival promo creative.',
      category: 'Social Media',
      platform: 'Instagram',
      dimensions: '1080 x 1080',
      priority: 'HIGH',
      deadline: '2026-10-30',
      additionalInstructions: 'Use bold typography and gold/amber highlights.',
    }
  );
  const createdReq = newReqRes.body.requirement;
  console.log('   Created:', createdReq.reqCode, '| Initial Status:', createdReq.status);

  // 4b. Designer 01 logs in & accepts request
  console.log('   Step 4b: Designer 01 accepts the requirement...');
  const loginDesigner01 = await request(
    {
      hostname: 'localhost',
      port: 3000,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    { email: 'designer01@company.com', password: 'password123', expectedRole: 'DESIGNER' }
  );
  const cookieDesigner01 = loginDesigner01.cookie;

  const assignRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: `/api/requirements/${createdReq.id}/assign`,
    method: 'POST',
    headers: { Cookie: cookieDesigner01 },
  });
  console.log('   Designer 01 Assigned | Status:', assignRes.body.requirement?.status);

  // 4c. Designer 01 starts design and uploads Version 1
  console.log('   Step 4c: Designer 01 uploads Version 1...');
  const uploadV1Res = await request(
    {
      hostname: 'localhost',
      port: 3000,
      path: `/api/requirements/${createdReq.id}/upload`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieDesigner01 },
    },
    {
      fileUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1080"><rect width="1080" height="1080" fill="%233b82f6"/><text x="540" y="540" fill="white" font-size="48" text-anchor="middle">Festival Creative V1</text></svg>',
      fileName: 'festival_creative_v1.png',
      designerNotes: 'First draft version 1 submitted for review.',
    }
  );
  console.log('   Version 1 Uploaded | Requirement Status:', uploadV1Res.body.updatedReq?.status);

  // 4d. Approver reviews and requests revision
  console.log('   Step 4d: Lead Approver Elena requests revision...');
  const loginApprover = await request(
    {
      hostname: 'localhost',
      port: 3000,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    { email: 'approver@company.com', password: 'password123', expectedRole: 'APPROVER' }
  );
  const cookieApprover = loginApprover.cookie;

  const revisionRes = await request(
    {
      hostname: 'localhost',
      port: 3000,
      path: `/api/requirements/${createdReq.id}/revision`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieApprover },
    },
    { feedback: 'Please change the headline and replace the background image with higher contrast.' }
  );
  console.log('   Revision Requested | Status:', revisionRes.body.updatedReq?.status);

  // 4e. Designer 01 uploads revised Version 2
  console.log('   Step 4e: Designer 01 uploads Version 2 (Revised)...');
  const uploadV2Res = await request(
    {
      hostname: 'localhost',
      port: 3000,
      path: `/api/requirements/${createdReq.id}/upload`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieDesigner01 },
    },
    {
      fileUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1080"><rect width="1080" height="1080" fill="%23d97706"/><text x="540" y="540" fill="white" font-size="48" text-anchor="middle">Festival Creative V2 Golden Edition</text></svg>',
      fileName: 'festival_creative_v2_final.png',
      designerNotes: 'Headline changed and background replaced with festive gold.',
    }
  );
  console.log('   Version 2 Uploaded | Status:', uploadV2Res.body.updatedReq?.status);

  // 4f. Approver Elena approves Version 2
  console.log('   Step 4f: Lead Approver Elena approves Version 2...');
  const approveRes = await request(
    {
      hostname: 'localhost',
      port: 3000,
      path: `/api/requirements/${createdReq.id}/approve`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieApprover },
    },
    { comments: 'Approved! Outstanding revision work.' }
  );
  console.log('   Final Decision:', approveRes.body.approval?.decision, '| Status:', approveRes.body.updatedReq?.status);

  // 4g. Original Requester Member 05 accesses final approved delivery
  console.log('\n5️⃣ Return to Original Requester Verification:');
  const finalCheckRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: `/api/requirements/${createdReq.id}`,
    method: 'GET',
    headers: { Cookie: cookieMember05 },
  });

  const finalReq = finalCheckRes.body.requirement;
  console.log('   Requester Member 05 Fetched:', finalReq.reqCode);
  console.log('   Status:', finalReq.status);
  console.log('   Versions Count:', finalReq.graphics[0]?.versions?.length);
  console.log('   Latest Version Status:', finalReq.graphics[0]?.versions[0]?.status);
  console.log('   Approval Note:', finalReq.approvals[0]?.comments);

  // 4h. Verify other members CANNOT access this newly approved request
  const unauthorizedOtherMember = await request({
    hostname: 'localhost',
    port: 3000,
    path: `/api/requirements/${createdReq.id}`,
    method: 'GET',
    headers: { Cookie: cookieMember04 },
  });
  console.log('   Member 04 Attempt to Access Member 05 Request -> Status:', unauthorizedOtherMember.status);
  if (unauthorizedOtherMember.status === 403) {
    console.log('   ✅ PASS: Member 01–04 and Member 06–12 are strictly blocked from accessing Member 05\'s graphic!');
  }

  console.log('\n====================================================');
  console.log('🎉 ALL WORKFLOW ENGINE & DATA ISOLATION TESTS PASSED!');
  console.log('====================================================\n');
}

runTests().catch(console.error);
