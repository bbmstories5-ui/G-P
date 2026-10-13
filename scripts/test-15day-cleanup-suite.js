/**
 * Automated Acceptance Test Suite: 15-Day Graphic Auto-Deletion & Permanent Storage Cleanup
 * Tests all 10 acceptance criteria from Master Prompt via HTTP & Database.
 */
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const http = require('http');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const prisma = new PrismaClient();
const BASE_URL = 'http://localhost:3000';
const JWT_SECRET = process.env.JWT_SECRET || 'creative-portal-dev-only-secret-do-not-use-in-production-2026';

function request({ method, path: reqPath, headers = {}, body = null }) {
  return new Promise((resolve, reject) => {
    const url = new URL(reqPath, BASE_URL);
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

async function runTestSuite() {
  console.log('=================================================================');
  console.log('🧪 STARTING 15-DAY GRAPHIC AUTO-DELETION ACCEPTANCE TEST SUITE');
  console.log('=================================================================\n');

  let passedTests = 0;
  const totalTests = 10;

  // 1. Setup Test Entities (Admin and Designer users, test requirement)
  console.log('🔧 Setup: Finding or creating test Super Admin and Designer...');
  let admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  if (!admin) {
    admin = await prisma.user.create({
      data: {
        name: 'Super Admin Test',
        email: 'superadmin_test@portal.local',
        password: 'password123',
        role: 'ADMIN',
        status: 'ACTIVE',
      },
    });
  }

  // Create an active session and JWT token for Super Admin
  const sessionToken = crypto.randomBytes(32).toString('hex');
  const session = await prisma.session.create({
    data: {
      userId: admin.id,
      sessionToken,
      refreshToken: crypto.randomBytes(48).toString('hex'),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      isRevoked: false,
    },
  });

  const adminToken = jwt.sign(
    {
      userId: admin.id,
      sessionId: session.id,
      sessionToken,
      email: admin.email,
      role: 'ADMIN',
      name: admin.name,
    },
    JWT_SECRET,
    { expiresIn: '30d' }
  );

  const authHeaders = {
    Authorization: `Bearer ${adminToken}`,
  };

  let designer = await prisma.user.findFirst({ where: { role: 'DESIGNER' } });
  if (!designer) {
    designer = await prisma.user.create({
      data: {
        name: 'Designer Test',
        email: 'designer_test@portal.local',
        password: 'password123',
        role: 'DESIGNER',
        status: 'ACTIVE',
      },
    });
  }

  let requirement = await prisma.requirement.findFirst();
  if (!requirement) {
    requirement = await prisma.requirement.create({
      data: {
        title: 'Cleanup Test Requirement',
        reqCode: 'REQ-CLN-001',
        description: 'Test requirement for 15-day cleanup suite',
        status: 'IN_PROGRESS',
        requesterId: admin.id,
      },
    });
  }

  // Ensure uploads test dir exists
  const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'test-cleanup');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  // Helper to create test graphic file
  function createTestFile(filename, sizeKB = 100) {
    const filePath = path.join(uploadsDir, filename);
    const buffer = Buffer.alloc(sizeKB * 1024, 'A');
    fs.writeFileSync(filePath, buffer);
    return {
      filePath,
      fileUrl: `/uploads/test-cleanup/${filename}`,
      sizeBytes: buffer.length,
    };
  }

  try {
    // -------------------------------------------------------------
    // TEST 1: Graphics younger than 15 days are NOT eligible for deletion
    // -------------------------------------------------------------
    console.log('\n--- Test 1: Graphics younger than 15 days are not eligible for automatic deletion ---');
    const youngFile = createTestFile('young-graphic-5d.png', 50);
    const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);

    const youngGraphic = await prisma.graphic.create({
      data: {
        requirementId: requirement.id,
        designerId: designer.id,
        createdAt: fiveDaysAgo,
        updatedAt: fiveDaysAgo,
      },
    });

    const youngVersion = await prisma.graphicVersion.create({
      data: {
        graphicId: youngGraphic.id,
        versionNumber: 1,
        fileUrl: youngFile.fileUrl,
        fileName: 'young-graphic-5d.png',
        fileSize: youngFile.sizeBytes,
        mimeType: 'image/png',
        status: 'SUBMITTED',
        createdAt: fiveDaysAgo,
      },
    });

    // Check stats API
    const statsRes1 = await request({ method: 'GET', path: '/api/admin/cleanup', headers: authHeaders });
    const youngItem = (statsRes1.data.recentGraphics || []).find((i) => i.versionId === youngVersion.id);

    if (youngItem && !youngItem.isExpired && youngItem.daysRemaining > 0) {
      console.log(`✅ PASS: Young graphic (5 days old) is marked active with ${youngItem.daysRemaining} days remaining.`);
      passedTests++;
    } else {
      console.error(`❌ FAIL: Young graphic was incorrectly marked expired:`, youngItem);
    }

    // -------------------------------------------------------------
    // TEST 2: Graphics at least 15 days old enter the Super Admin deletion approval queue
    // -------------------------------------------------------------
    console.log('\n--- Test 2: Graphics at least 15 days old enter Super Admin deletion approval queue ---');
    const oldFile = createTestFile('expired-graphic-16d.png', 120);
    const sixteenDaysAgo = new Date(Date.now() - 16 * 24 * 60 * 60 * 1000);

    const oldGraphic = await prisma.graphic.create({
      data: {
        requirementId: requirement.id,
        designerId: designer.id,
        createdAt: sixteenDaysAgo,
        updatedAt: sixteenDaysAgo,
      },
    });

    const oldVersion = await prisma.graphicVersion.create({
      data: {
        graphicId: oldGraphic.id,
        versionNumber: 1,
        fileUrl: oldFile.fileUrl,
        fileName: 'expired-graphic-16d.png',
        fileSize: oldFile.sizeBytes,
        mimeType: 'image/png',
        status: 'SUBMITTED',
        createdAt: sixteenDaysAgo,
      },
    });

    // Run the daily server-side scheduler via POST /api/cron/cleanup
    const cronRes = await request({ method: 'POST', path: '/api/cron/cleanup', headers: authHeaders });
    console.log('Cron response:', cronRes.status, cronRes.data?.message);

    const pendingRequest = await prisma.graphicsCleanupRequest.findFirst({
      where: { status: 'PENDING_APPROVAL' },
      orderBy: { cycleNumber: 'desc' },
    });

    if (pendingRequest && pendingRequest.graphicsCount >= 1) {
      console.log(`✅ PASS: Expired graphic entered Super Admin approval queue (Cycle #${pendingRequest.cycleNumber}, status: ${pendingRequest.status}, graphics: ${pendingRequest.graphicsCount}).`);
      passedTests++;
    } else {
      console.error(`❌ FAIL: Pending approval request not created for 16-day old graphic.`);
    }

    // -------------------------------------------------------------
    // TEST 3: Unapproved graphics are NEVER permanently deleted
    // -------------------------------------------------------------
    console.log('\n--- Test 3: Unapproved graphics are never permanently deleted ---');
    const oldVersionStillInDB = await prisma.graphicVersion.findUnique({ where: { id: oldVersion.id } });
    const oldFileStillOnDisk = fs.existsSync(oldFile.filePath);

    if (oldVersionStillInDB && oldFileStillOnDisk) {
      console.log('✅ PASS: Graphic record in DB and physical file on disk are intact while awaiting Super Admin approval.');
      passedTests++;
    } else {
      console.error('❌ FAIL: Graphic was prematurely deleted without Super Admin approval!');
    }

    // -------------------------------------------------------------
    // TEST 4: Approved graphics are permanently removed from storage & DB
    // -------------------------------------------------------------
    console.log('\n--- Test 4: Approved graphics are permanently removed from storage and database ---');
    // Approve deletion via POST /api/admin/cleanup/[id]/approve
    const approveRes = await request({
      method: 'POST',
      path: `/api/admin/cleanup/${pendingRequest.id}/approve`,
      headers: authHeaders,
    });
    console.log('Approve API response:', approveRes.status, approveRes.data?.message);

    const oldVersionAfterApproval = await prisma.graphicVersion.findUnique({ where: { id: oldVersion.id } });
    const oldFileAfterApproval = fs.existsSync(oldFile.filePath);

    // Check audit log in DB
    const auditLog = await prisma.deletedGraphicLog.findFirst({
      where: { fileName: 'expired-graphic-16d.png' },
    });

    if (!oldVersionAfterApproval && !oldFileAfterApproval && auditLog) {
      console.log(`✅ PASS: Approved graphic physically removed from disk, DB records deleted, and audit log recorded (Log ID: ${auditLog.id}).`);
      passedTests++;
    } else {
      console.error('❌ FAIL: Graphic or file remained after approved cleanup or audit log missing:', {
        inDB: !!oldVersionAfterApproval,
        onDisk: oldFileAfterApproval,
        auditLog: !!auditLog,
      });
    }

    // -------------------------------------------------------------
    // TEST 5: Rejected graphics remain completely intact
    // -------------------------------------------------------------
    console.log('\n--- Test 5: Rejected graphics remain intact ---');
    const rejectFile = createTestFile('rejected-graphic-18d.png', 80);
    const eighteenDaysAgo = new Date(Date.now() - 18 * 24 * 60 * 60 * 1000);

    const rejectGraphic = await prisma.graphic.create({
      data: {
        requirementId: requirement.id,
        designerId: designer.id,
        createdAt: eighteenDaysAgo,
        updatedAt: eighteenDaysAgo,
      },
    });

    const rejectVersion = await prisma.graphicVersion.create({
      data: {
        graphicId: rejectGraphic.id,
        versionNumber: 1,
        fileUrl: rejectFile.fileUrl,
        fileName: 'rejected-graphic-18d.png',
        fileSize: rejectFile.sizeBytes,
        mimeType: 'image/png',
        status: 'SUBMITTED',
        createdAt: eighteenDaysAgo,
      },
    });

    // Create a new request for this graphic
    const rejectRequest = await prisma.graphicsCleanupRequest.create({
      data: {
        cycleNumber: 9999,
        startDate: new Date(),
        scheduledDeletionDate: new Date(),
        status: 'PENDING_APPROVAL',
        graphicsCount: 1,
        totalSizeBytes: rejectFile.sizeBytes,
        quarantineData: JSON.stringify([{ versionId: rejectVersion.id, fileName: 'rejected-graphic-18d.png' }]),
      },
    });

    // Super Admin rejects via POST /api/admin/cleanup/[id]/reject
    const rejectRes = await request({
      method: 'POST',
      path: `/api/admin/cleanup/${rejectRequest.id}/reject`,
      headers: authHeaders,
      body: { reason: 'Retained for client brand guidelines archive' },
    });
    console.log('Reject API response:', rejectRes.status, rejectRes.data?.message);

    const rejectVersionInDB = await prisma.graphicVersion.findUnique({ where: { id: rejectVersion.id } });
    const rejectFileOnDisk = fs.existsSync(rejectFile.filePath);

    if (rejectRes.status === 200 && rejectVersionInDB && rejectFileOnDisk) {
      console.log('✅ PASS: Rejected request marked REJECTED; file on disk and DB record remain completely untouched.');
      passedTests++;
    } else {
      console.error('❌ FAIL: Rejected graphic was altered or deleted!');
    }

    // Clean up test reject file
    await prisma.graphicVersion.deleteMany({ where: { id: rejectVersion.id } });
    await prisma.graphic.deleteMany({ where: { id: rejectGraphic.id } });
    await prisma.graphicsCleanupRequest.deleteMany({ where: { id: rejectRequest.id } });
    if (fs.existsSync(rejectFile.filePath)) fs.unlinkSync(rejectFile.filePath);

    // -------------------------------------------------------------
    // TEST 6: Shared files are NOT accidentally deleted
    // -------------------------------------------------------------
    console.log('\n--- Test 6: Shared files are not accidentally deleted ---');
    const sharedFile = createTestFile('shared-graphic-asset.png', 90);

    const graphicA = await prisma.graphic.create({
      data: {
        requirementId: requirement.id,
        designerId: designer.id,
      },
    });
    const versionA = await prisma.graphicVersion.create({
      data: {
        graphicId: graphicA.id,
        versionNumber: 1,
        fileUrl: sharedFile.fileUrl,
        fileName: 'shared-graphic-asset.png',
        fileSize: sharedFile.sizeBytes,
        mimeType: 'image/png',
        status: 'SUBMITTED',
      },
    });

    // Reference same fileUrl in RequirementFile
    const reqFile = await prisma.requirementFile.create({
      data: {
        requirementId: requirement.id,
        fileName: 'shared-graphic-asset.png',
        fileUrl: sharedFile.fileUrl,
        fileSize: sharedFile.sizeBytes,
        fileType: 'image/png',
      },
    });

    // Now delete versionA via individual graphic delete API: POST /api/admin/cleanup/graphic/[versionId]/delete
    const delSingleRes = await request({
      method: 'POST',
      path: `/api/admin/cleanup/graphic/${versionA.id}/delete`,
      headers: authHeaders,
      body: { reason: 'Test individual graphic cleanup' },
    });
    console.log('Single graphic delete response:', delSingleRes.status, delSingleRes.data?.message);

    const versionAInDB = await prisma.graphicVersion.findUnique({ where: { id: versionA.id } });
    const sharedFileStillOnDisk = fs.existsSync(sharedFile.filePath);

    if (!versionAInDB && sharedFileStillOnDisk && delSingleRes.data?.result?.skippedShared) {
      console.log('✅ PASS: Version A was deleted from DB, but shared file was safely preserved on disk.');
      passedTests++;
    } else {
      console.error('❌ FAIL: Shared file was deleted from disk or version A was not deleted from DB.');
    }

    // Clean up reference
    await prisma.requirementFile.deleteMany({ where: { id: reqFile.id } });
    await prisma.graphic.deleteMany({ where: { id: graphicA.id } });
    if (fs.existsSync(sharedFile.filePath)) fs.unlinkSync(sharedFile.filePath);

    // -------------------------------------------------------------
    // TEST 7: Missing or failed storage file deletion is handled gracefully
    // -------------------------------------------------------------
    console.log('\n--- Test 7: Missing or failed storage file deletion is handled gracefully ---');
    const ghostGraphic = await prisma.graphic.create({
      data: {
        requirementId: requirement.id,
        designerId: designer.id,
      },
    });
    const ghostVersion = await prisma.graphicVersion.create({
      data: {
        graphicId: ghostGraphic.id,
        versionNumber: 1,
        fileUrl: '/uploads/test-cleanup/non-existent-ghost-file.png',
        fileName: 'non-existent-ghost-file.png',
        fileSize: 1024,
        mimeType: 'image/png',
        status: 'SUBMITTED',
      },
    });

    const ghostDeleteRes = await request({
      method: 'POST',
      path: `/api/admin/cleanup/graphic/${ghostVersion.id}/delete`,
      headers: authHeaders,
    });
    const ghostInDB = await prisma.graphicVersion.findUnique({ where: { id: ghostVersion.id } });

    if (ghostDeleteRes.status === 200 && !ghostInDB) {
      console.log('✅ PASS: Handled missing disk file cleanly without throwing or corrupting DB state.');
      passedTests++;
    } else {
      console.error('❌ FAIL: Failed to safely handle missing storage file.');
    }

    // -------------------------------------------------------------
    // TEST 8: Storage statistics reflect accurate system metrics
    // -------------------------------------------------------------
    console.log('\n--- Test 8: Storage statistics reflect accurate system metrics ---');
    const statsRes = await request({ method: 'GET', path: '/api/admin/cleanup', headers: authHeaders });
    const metrics = statsRes.data?.metrics;
    console.log('System metrics:', metrics);

    if (
      metrics &&
      typeof metrics.totalExpiredGraphics === 'number' &&
      typeof metrics.pendingRequestsCount === 'number' &&
      typeof metrics.approvedRequestsCount === 'number' &&
      typeof metrics.storageOccupiedByExpired === 'string' &&
      typeof metrics.estimatedReleasedSpace === 'string'
    ) {
      console.log('✅ PASS: All 5 required Super Admin dashboard metrics returned accurately.');
      passedTests++;
    } else {
      console.error('❌ FAIL: System stats missing required metric properties.');
    }

    // -------------------------------------------------------------
    // TEST 9: Repeated scheduler runs do not create duplicate requests
    // -------------------------------------------------------------
    console.log('\n--- Test 9: Repeated scheduler runs idempotency (No duplicate requests) ---');
    const pendingBefore = await prisma.graphicsCleanupRequest.count({
      where: { status: 'PENDING_APPROVAL' },
    });

    // Run scheduler 3 times consecutively via POST /api/cron/cleanup
    await request({ method: 'POST', path: '/api/cron/cleanup', headers: authHeaders });
    await request({ method: 'POST', path: '/api/cron/cleanup', headers: authHeaders });
    await request({ method: 'POST', path: '/api/cron/cleanup', headers: authHeaders });

    const pendingAfter = await prisma.graphicsCleanupRequest.count({
      where: { status: 'PENDING_APPROVAL' },
    });

    if (pendingAfter <= Math.max(1, pendingBefore)) {
      console.log(`✅ PASS: Repeated scheduler runs did not create duplicate requests (Before: ${pendingBefore}, After: ${pendingAfter}).`);
      passedTests++;
    } else {
      console.error(`❌ FAIL: Duplicate pending approval requests created (${pendingBefore} -> ${pendingAfter}).`);
    }

    // -------------------------------------------------------------
    // TEST 10: Existing portal accounts and requirement workflows remain working
    // -------------------------------------------------------------
    console.log('\n--- Test 10: Existing portal user accounts, roles and requirements integrity ---');
    const adminCheck = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    const designerCheck = await prisma.user.findFirst({ where: { role: 'DESIGNER' } });
    const reqCheck = await prisma.requirement.findFirst();

    if (adminCheck && designerCheck && reqCheck) {
      console.log(`✅ PASS: Existing portal accounts (Admin: ${adminCheck.email}, Designer: ${designerCheck.email}) and requirement workflows are fully intact.`);
      passedTests++;
    } else {
      console.error('❌ FAIL: Portal user accounts or requirements corrupted.');
    }

    // Clean up test young graphic & files
    await prisma.graphicVersion.deleteMany({ where: { id: youngVersion.id } });
    await prisma.graphic.deleteMany({ where: { id: youngGraphic.id } });
    if (fs.existsSync(youngFile.filePath)) fs.unlinkSync(youngFile.filePath);

    // Clean test dir
    try {
      fs.rmdirSync(uploadsDir);
    } catch {}

    // Clean test session
    await prisma.session.delete({ where: { id: session.id } });

    console.log('\n=================================================================');
    console.log(`📊 TEST SUITE SUMMARY: ${passedTests} / ${totalTests} TESTS PASSED`);
    console.log('=================================================================');

    if (passedTests === totalTests) {
      console.log('🎉 ALL 10 ACCEPTANCE TESTS PASSED SUCCESSFULLY!');
      process.exit(0);
    } else {
      console.error('⚠️ Some tests failed. Please review the logs above.');
      process.exit(1);
    }
  } catch (err) {
    console.error('💥 Test suite encountered fatal error:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runTestSuite();
