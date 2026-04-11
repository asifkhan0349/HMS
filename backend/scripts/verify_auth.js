const http = require('http');

const PORT = 8001;
const BASE_URL = `http://127.0.0.1:${PORT}`;

async function testRoute(path, name, headers = {}) {
  return new Promise((resolve) => {
    console.log(`Testing ${name} (${path})...`);
    http.get(`${BASE_URL}${path}`, { headers }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        console.log(`Status: ${res.statusCode}`);
        // console.log(`Response: ${data}`);
        resolve(res.statusCode);
      });
    }).on('error', (err) => {
      console.error(`Error: ${err.message}`);
      resolve(500);
    });
  });
}

async function runTests() {
  console.log('--- STARTING AUTH ENFORCEMENT VERIFICATION ---');

  // 1. Missing Token on Protected Route
  const s1 = await testRoute('/api/patients', 'Protected Route (Missing Token)');
  if (s1 === 401) console.log('✅ Correctly rejected with 401');
  else console.log('❌ FAILED: Should have rejected with 401');

  // 2. Invalid Token on Protected Route
  const s2 = await testRoute('/api/patients', 'Protected Route (Invalid Token)', { 'Authorization': 'Bearer invalid-token' });
  if (s2 === 401) console.log('✅ Correctly rejected with 401');
  else console.log('❌ FAILED: Should have rejected with 401');

  // 3. Public Route (Health)
  const s3 = await testRoute('/api/health', 'Public Route (Health Check)');
  if (s3 === 200) console.log('✅ Correctly allowed 200');
  else console.log(`❌ FAILED: Should have allowed 200 (Got ${s3})`);

  // 4. Public Route (Login - should fall through to proxy then return 405 or 401 from FastAPI if not POST, but Node should ALLOW it to pass)
  // Actually since we use http.get, it might return 405 from FastAPI, but the important thing is it's NOT a 401 from Node middleware.
  const s4 = await testRoute('/api/auth/login', 'Public Route (Login - GET)');
  if (s4 !== 401) console.log(`✅ Correctly allowed through (Got ${s4})`);
  else console.log('❌ FAILED: Should not have been blocked by auth middleware');

  console.log('--- VERIFICATION COMPLETE ---');
}

runTests();
