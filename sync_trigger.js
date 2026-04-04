const axios = require('axios');

async function sync() {
  try {
    console.log('Logging in...');
    // Support both /auth/login and /admin/login
    let loginRes;
    try {
      loginRes = await axios.post('http://localhost:3000/auth/login', {
        email: 'admin@store.com',
        password: 'password123'
      });
    } catch (e) {
      loginRes = await axios.post('http://localhost:3000/admin/login', {
        email: 'admin@store.com',
        password: 'password123'
      });
    }
    
    const token = loginRes.data.access_token || loginRes.data.token || loginRes.data.accessToken;
    if (!token) throw new Error('No token found in response');
    console.log('Login successful.');
    
    console.log('Starting sync...');
    const syncRes = await axios.post('http://localhost:3000/admin/sync-categories', {}, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('--- SYNC SUCCESS ---');
    console.log(syncRes.data);
    console.log('--------------------');
  } catch (error) {
    console.error('Sync failed:', error.response?.data || error.message);
  }
}

sync();
