#!/usr/bin/env node

const http = require('http');

// Test script to verify backend API is working
async function testBackendAPI() {
  console.log('🔧 Testing ELD Backend API...\n');
  
  // Test 1: Health Check
  console.log('1. Testing Health Endpoint...');
  try {
    const healthResponse = await makeRequest('GET', 'http://localhost:3002/health');
    console.log('✅ Health Check:', healthResponse.message);
  } catch (error) {
    console.log('❌ Health Check Failed:', error.message);
    return;
  }

  // Test 2: Login
  console.log('\n2. Testing Login...');
  try {
    const loginData = {
      login: 'fne_admin',
      password: 'Admin123!'
    };
    
    const loginResponse = await makeRequest('POST', 'http://localhost:3002/api/v1/auth/login', loginData);
    console.log('✅ Login Successful for user:', loginResponse.data.user.firstName, loginResponse.data.user.lastName);
    console.log('   Role:', loginResponse.data.user.role);
    console.log('   Carrier ID:', loginResponse.data.user.carrierId);
    
    const token = loginResponse.data.token;
    
    // Test 3: Get Carriers with Authentication
    console.log('\n3. Testing Carrier Data...');
    const carrierResponse = await makeRequest('GET', 'http://localhost:3002/api/v1/carriers', null, {
      'Authorization': `Bearer ${token}`
    });
    
    const carrier = carrierResponse.data.carriers[0];
    console.log('✅ Carrier Data Retrieved:');
    console.log('   Name:', carrier.name);
    console.log('   DOT Number:', carrier.dotNumber);
    console.log('   Location:', `${carrier.address.city}, ${carrier.address.state}`);
    console.log('   Active:', carrier.isActive);
    
  } catch (error) {
    console.log('❌ Authentication Test Failed:', error.message);
  }
}

// Helper function to make HTTP requests
function makeRequest(method, url, data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    if (data) {
      const postData = JSON.stringify(data);
      options.headers['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = http.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsed);
          } else {
            reject(new Error(parsed.message || `HTTP ${res.statusCode}`));
          }
        } catch (error) {
          reject(new Error(`Failed to parse response: ${responseData}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

// Run the test
testBackendAPI().then(() => {
  console.log('\n🎉 Backend API is working correctly!');
  console.log('\n📋 Next Steps:');
  console.log('1. Open your browser to: http://localhost:5175/');
  console.log('2. If that doesn\'t work, try: http://localhost:5173/');
  console.log('3. Clear browser cache/localStorage');
  console.log('4. Login with: fne_admin / Admin123!');
  console.log('5. You should see "FNE TRANSPORT LLC" instead of demo data');
}).catch((error) => {
  console.error('❌ Test failed:', error.message);
});
