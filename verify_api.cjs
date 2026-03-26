const http = require('http');

function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data: JSON.parse(data || '{}') }));
    });
    req.on('error', reject);
    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

async function verify() {
  console.log('--- Registering Initial Admin ---');
  const signupData = JSON.stringify({ 
      full_name: 'System Admin', 
      username: 'admin', 
      email: 'admin@hms.local', 
      password: 'adminpassword123',
      role: 'Admin'
  });
  
  const signupReq = await makeRequest({
    hostname: 'localhost',
    port: 8000,
    path: '/api/auth/signup',
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': signupData.length }
  }, signupData);
  
  console.log('Signup Status:', signupReq.status);
  
  console.log('\n--- Testing Login ---');
  const loginData = JSON.stringify({ username: 'admin', password: 'adminpassword123' });
  const loginReq = await makeRequest({
    hostname: 'localhost',
    port: 8000,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': loginData.length }
  }, loginData);
  
  console.log('Login Status:', loginReq.status);
  if (loginReq.status !== 200) {
    console.error('Login failed:', loginReq.data);
    return;
  }
  
  const userId = loginReq.data.user.id;
  console.log('Successfully retrieved User ID:', userId);
  
  console.log('\n--- Testing Dashboard Data via X-User-Id ---');
  const patientsReq = await makeRequest({
    hostname: 'localhost',
    port: 8000,
    path: '/api/patients',
    method: 'GET',
    headers: { 'X-User-Id': userId.toString() }
  });
  
  console.log('Patients Status:', patientsReq.status);
  console.log('Patients array length:', Array.isArray(patientsReq.data) ? patientsReq.data.length : 'Not an array');

  console.log('\n✅ Verification Complete.');
}

verify();
