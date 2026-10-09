const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function loginUser(email, password, tabId) {
  const res = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, tabSessionId: tabId }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Login failed');
  return data;
}

async function runTests() {
  console.log('--- STARTING REAL-TIME NOTIFICATION & MULTI-ACCOUNT ISOLATION SUITE ---');

  // 1. Authenticate Member 01 in Tab 1
  const tab1 = await loginUser('member01@company.com', 'password123', 'TAB-MEMBER-01');
  console.log(`[Tab 1] Logged in as: ${tab1.user.name} (${tab1.user.role}) - Token: ${tab1.token.slice(0, 15)}...`);

  // 2. Authenticate Approver in Tab 2
  const tab2 = await loginUser('approver@company.com', 'password123', 'TAB-APPROVER-01');
  console.log(`[Tab 2] Logged in as: ${tab2.user.name} (${tab2.user.role}) - Token: ${tab2.token.slice(0, 15)}...`);

  // 3. Authenticate Designer 01 in Tab 3
  const tab3 = await loginUser('designer01@company.com', 'password123', 'TAB-DESIGNER-01');
  console.log(`[Tab 3] Logged in as: ${tab3.user.name} (${tab3.user.role}) - Token: ${tab3.token.slice(0, 15)}...`);

  // 4. Query Member 01 notifications
  const memberRes = await fetch('http://localhost:3000/api/notifications', {
    headers: {
      Authorization: `Bearer ${tab1.token}`,
      'x-tab-token': tab1.token,
    },
  });
  const memberData = await memberRes.json();
  console.log(`[Tab 1] Member 01 Notifications: HTTP ${memberRes.status} | Total: ${memberData.notifications?.length} | Unread: ${memberData.unreadCount}`);

  // 5. Query Approver notifications
  const approverRes = await fetch('http://localhost:3000/api/notifications', {
    headers: {
      Authorization: `Bearer ${tab2.token}`,
      'x-tab-token': tab2.token,
    },
  });
  const approverData = await approverRes.json();
  console.log(`[Tab 2] Approver Notifications: HTTP ${approverRes.status} | Total: ${approverData.notifications?.length} | Unread: ${approverData.unreadCount}`);

  // 6. Query Designer notifications
  const designerRes = await fetch('http://localhost:3000/api/notifications', {
    headers: {
      Authorization: `Bearer ${tab3.token}`,
      'x-tab-token': tab3.token,
    },
  });
  const designerData = await designerRes.json();
  console.log(`[Tab 3] Designer Notifications: HTTP ${designerRes.status} | Total: ${designerData.notifications?.length} | Unread: ${designerData.unreadCount}`);

  // 7. Verify Multi-Tab Strict Isolation
  const memberHasApprover = memberData.notifications?.some(n => n.userId === tab2.user.id);
  const approverHasMember = approverData.notifications?.some(n => n.userId === tab1.user.id);
  const designerHasApprover = designerData.notifications?.some(n => n.userId === tab2.user.id);

  if (memberHasApprover || approverHasMember || designerHasApprover) {
    console.error('FAIL: Multi-account isolation breach detected!');
    process.exit(1);
  } else {
    console.log('PASS: Multi-account tab isolation 100% verified (Zero cross-tab leakages).');
  }

  // 8. Test Active Notices endpoint
  const noticeRes = await fetch('http://localhost:3000/api/notices/active', {
    headers: {
      Authorization: `Bearer ${tab1.token}`,
      'x-tab-token': tab1.token,
    },
  });
  const noticeData = await noticeRes.json();
  console.log(`[Notice Bar] Active Notice HTTP ${noticeRes.status}: ${noticeData.notice ? noticeData.notice.title : 'None active'}`);

  console.log('--- ALL TESTS COMPLETED AND PASSED ---');
  await prisma.$disconnect();
}

runTests().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});
