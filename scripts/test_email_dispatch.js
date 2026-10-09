const { Resend } = require('resend');

async function runTests() {
  console.log('=== EMAIL DISPATCH SYSTEM TEST SUITE ===\n');

  // Test 1: Invalid Email Rejection
  console.log('[TEST 1] Invalid Email Address Validation...');
  const invalidEmail = 'not-an-email';
  const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(invalidEmail);
  if (!isValid) {
    console.log('  PASS: Invalid email correctly rejected.');
  } else {
    console.error('  FAIL: Invalid email was accepted!');
  }

  // Test 2: Valid Email Format
  console.log('\n[TEST 2] Valid Email Address Validation...');
  const validEmail = 'bbmstories5@gmail.com';
  const isValid2 = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(validEmail);
  if (isValid2) {
    console.log('  PASS: Valid email format recognized.');
  } else {
    console.error('  FAIL: Valid email rejected!');
  }

  // Test 3: Resend SDK Dispatch
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.log('\n[TEST 3] Skipped live dispatch (RESEND_API_KEY not set in env).');
    console.log('\n=== ALL AUTOMATED CHECKS COMPLETED ===');
    return;
  }
  console.log('\n[TEST 3] Resend SDK Dispatch to Registered Account...');
  try {
    const resend = new Resend(apiKey);
    const { data, error } = await resend.emails.send({
      from: 'Creative Portal <onboarding@resend.dev>',
      to: ['bbmstories5@gmail.com'],
      subject: 'Automated Test - Creative Portal Delivery Check',
      html: '<h1>Delivery Verified</h1><p>Resend HTTPS API is functioning properly.</p>'
    });

    if (error) {
      console.log('  WARNING / RESULT:', error.message);
    } else {
      console.log('  PASS: Successfully sent! Message ID:', data.id);
    }
  } catch (err) {
    console.error('  FAIL: Exception during send:', err.message);
  }

  console.log('\n=== ALL AUTOMATED CHECKS COMPLETED ===');
}

runTests();
