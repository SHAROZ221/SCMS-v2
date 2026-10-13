process.env.NODE_ENV = 'test';
const http = require('http');


// Helper to make JSON HTTP requests
function request({ method, path, headers = {}, body = null }) {
  return new Promise((resolve, reject) => {
    const postData = body ? JSON.stringify(body) : null;
    const reqOptions = {
      hostname: 'localhost',
      port: 5000,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(postData ? { 'Content-Length': Buffer.byteLength(postData) } : {}),
        ...headers,
      },
    };

    const req = http.request(reqOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const json = data ? JSON.parse(data) : {};
          resolve({ status: res.statusCode, headers: res.headers, data: json });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, data });
        }
      });
    });

    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

async function runTests() {
  console.log('🧪 Starting Authentication & Authorization Tests...\n');
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    // 1. Health check
    const health = await request({ method: 'GET', path: '/api/health' });
    assert(health.status === 200 && health.data.status === 'ok', 'Server health check returns ok');

    // 2. Login as admin
    const adminLogin = await request({
      method: 'POST',
      path: '/api/auth/login',
      body: { email: 'admin@scms.com', password: 'password123' },
    });
    assert(adminLogin.status === 200 && adminLogin.data.token && adminLogin.data.user.role === 'admin', 'Admin login successful and returned JWT');
    const adminToken = adminLogin.data.token;

    // 3. Login with invalid password
    const failLogin = await request({
      method: 'POST',
      path: '/api/auth/login',
      body: { email: 'admin@scms.com', password: 'wrongpassword' },
    });
    assert(failLogin.status === 401, 'Invalid password correctly rejected with 401');

    // 4. Login as technician
    const techLogin = await request({
      method: 'POST',
      path: '/api/auth/login',
      body: { email: 'technician@scms.com', password: 'password123' },
    });
    assert(techLogin.status === 200 && techLogin.data.user.role === 'technician', 'Technician login successful');
    const techToken = techLogin.data.token;

    // 5. Access /api/auth/me without token
    const unauthMe = await request({ method: 'GET', path: '/api/auth/me' });
    assert(unauthMe.status === 401, 'Accessing /api/auth/me without token correctly rejected with 401');

    // 6. Access /api/auth/me with valid token
    const authMe = await request({
      method: 'GET',
      path: '/api/auth/me',
      headers: { Authorization: `Bearer ${techToken}` },
    });
    assert(authMe.status === 200 && authMe.data.user.email === 'technician@scms.com', 'Authenticated profile lookup succeeded');

    // 7. Role guard: Technician attempting admin-only user creation
    const techForbidden = await request({
      method: 'POST',
      path: '/api/auth/register',
      headers: { Authorization: `Bearer ${techToken}` },
      body: { name: 'Illegal User', email: 'illegal@scms.com', password: 'password123', role: 'technician' },
    });
    assert(techForbidden.status === 403, 'Role guard properly blocked non-admin from creating users with 403 Forbidden');

    // 8. Admin registers a new user
    const newUserEmail = `newuser_${Date.now()}@scms.com`;
    const adminRegister = await request({
      method: 'POST',
      path: '/api/auth/register',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { name: 'New FrontDesk Staff', email: newUserEmail, password: 'password123', role: 'receptionist' },
    });
    assert(adminRegister.status === 201 && adminRegister.data.user.email === newUserEmail, 'Admin successfully registered new user');
    const newUserId = adminRegister.data.user.id;

    // 9. New user login
    const newUserLogin = await request({
      method: 'POST',
      path: '/api/auth/login',
      body: { email: newUserEmail, password: 'password123' },
    });
    assert(newUserLogin.status === 200 && newUserLogin.data.token, 'New user successfully logged in');
    const newUserToken = newUserLogin.data.token;

    // 10. Change password
    const changePass = await request({
      method: 'PUT',
      path: '/api/auth/change-password',
      headers: { Authorization: `Bearer ${newUserToken}` },
      body: { currentPassword: 'password123', newPassword: 'newpassword456' },
    });
    assert(changePass.status === 200, 'User successfully changed their password');

    // 11. Login with new password
    const loginAfterChange = await request({
      method: 'POST',
      path: '/api/auth/login',
      body: { email: newUserEmail, password: 'newpassword456' },
    });
    assert(loginAfterChange.status === 200, 'User successfully logged in with updated password');

    // 12. Admin lists users
    const listUsers = await request({
      method: 'GET',
      path: '/api/auth/users',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(listUsers.status === 200 && Array.isArray(listUsers.data.users) && listUsers.data.count >= 4, 'Admin successfully listed all users');

    // 13. Admin deactivates user
    const deactivate = await request({
      method: 'PUT',
      path: `/api/auth/users/${newUserId}`,
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { is_active: false },
    });
    assert(deactivate.status === 200 && deactivate.data.user.is_active === false, 'Admin successfully deactivated user');

    // 14. Deactivated user login rejected
    const blockedLogin = await request({
      method: 'POST',
      path: '/api/auth/login',
      body: { email: newUserEmail, password: 'newpassword456' },
    });
    assert(blockedLogin.status === 403, 'Deactivated user login properly blocked with 403');

    console.log(`\n🏁 Test Results: ${passed} passed, ${failed} failed.`);
    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('Test execution error:', err);
    process.exit(1);
  }
}

// Start server in-process if not already listening
const app = require('../src/server');
const server = app.listen(5000, () => {
  runTests().finally(() => {
    server.close();
  });
});
