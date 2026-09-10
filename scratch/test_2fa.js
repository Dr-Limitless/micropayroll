const totp = require('../server/utils/totp');

async function test() {
  console.log('--- 1. Testing TOTP Generation & Verification ---');
  const secret = totp.generateSecret();
  console.log('Generated Base32 Secret:', secret);
  const code = totp.generateTotp(secret);
  console.log('Current 6-digit Code:', code);
  const isValid = totp.verifyTotp(code, secret);
  console.log('Verification check:', isValid ? 'PASSED ✅' : 'FAILED ❌');

  console.log('\n--- 2. Testing API Login without 2FA ---');
  const loginRes = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@mms.com', password: 'password123' })
  });
  const loginData = await loginRes.json();
  console.log('Login status:', loginData.access_token ? 'SUCCESS ✅' : 'FAILED ❌');
  const token = loginData.access_token;

  console.log('\n--- 3. Testing 2FA Setup Endpoint ---');
  const setupRes = await fetch('http://localhost:5000/api/auth/2fa/setup', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const setupData = await setupRes.json();
  console.log('Setup generated secret:', setupData.secret);
  console.log('Setup QR Data URL exists:', Boolean(setupData.qr_code && setupData.qr_code.startsWith('data:image/png')));

  console.log('\n--- 4. Testing 2FA Activation with Code ---');
  const activationCode = totp.generateTotp(setupData.secret);
  const activateRes = await fetch('http://localhost:5000/api/auth/2fa/activate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ secret: setupData.secret, totp_code: activationCode })
  });
  const activateData = await activateRes.json();
  console.log('Activation result:', activateData.message, activateData.success ? 'PASSED ✅' : 'FAILED ❌');

  console.log('\n--- 5. Testing Login with 2FA Enabled (Step 1: credentials only) ---');
  const step1Res = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@mms.com', password: 'password123' })
  });
  const step1Data = await step1Res.json();
  console.log('Step 1 require_2fa returned:', step1Data.require_2fa ? 'PASSED ✅' : 'FAILED ❌');

  console.log('\n--- 6. Testing Login with 2FA Enabled (Step 2: invalid code) ---');
  const invalidStep2 = await fetch('http://localhost:5000/api/auth/login/2fa', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@mms.com', totp_code: '000000' })
  });
  console.log('Invalid code rejected:', invalidStep2.status === 400 ? 'PASSED ✅' : 'FAILED ❌');

  console.log('\n--- 7. Testing Login with 2FA Enabled (Step 2: valid code) ---');
  const validCode = totp.generateTotp(setupData.secret);
  const validStep2 = await fetch('http://localhost:5000/api/auth/login/2fa', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@mms.com', totp_code: validCode })
  });
  const validStep2Data = await validStep2.json();
  console.log('Valid code login success:', Boolean(validStep2Data.access_token) ? 'PASSED ✅' : 'FAILED ❌');

  console.log('\n--- 8. Testing 2FA Disable ---');
  const disableRes = await fetch('http://localhost:5000/api/auth/2fa/disable', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${validStep2Data.access_token}` }
  });
  const disableData = await disableRes.json();
  console.log('Disable result:', disableData.message);

  console.log('\n--- 9. Verify Login after 2FA Disabled ---');
  const afterDisable = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@mms.com', password: 'password123' })
  });
  const afterDisableData = await afterDisable.json();
  console.log('Direct login after disable:', Boolean(afterDisableData.access_token) ? 'PASSED ✅' : 'FAILED ❌');
}

test().catch(err => console.error(err));
