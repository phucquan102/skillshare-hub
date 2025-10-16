// quick-test.js
require('dotenv').config();
const jwt = require('jsonwebtoken');

console.log('🔐 Testing Jitsi JWT Configuration...\n');

// Kiểm tra biến môi trường
console.log('📋 Environment Variables:');
console.log('- JITSI_APP_ID:', process.env.JITSI_APP_ID ? '✅' : '❌');
console.log('- JITSI_KID:', process.env.JITSI_KID ? '✅' : '❌');
console.log('- JITSI_PRIVATE_KEY:', process.env.JITSI_PRIVATE_KEY ? '✅' : '❌');

if (process.env.JITSI_PRIVATE_KEY) {
  const key = process.env.JITSI_PRIVATE_KEY;
  console.log('\n📝 Private Key Structure:');
  console.log('- Has BEGIN:', key.includes('BEGIN PRIVATE KEY') ? '✅' : '❌');
  console.log('- Has END:', key.includes('END PRIVATE KEY') ? '✅' : '❌');
  console.log('- Key length:', key.length);
  
  // Test JWT generation
  try {
    const testPayload = {
      aud: 'jitsi',
      iss: 'chat',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
      nbf: Math.floor(Date.now() / 1000),
      sub: process.env.JITSI_APP_ID,
      context: {
        user: {
          moderator: true,
          name: 'Test User',
          id: 'test-123'
        }
      },
      room: 'test-room'
    };

    const token = jwt.sign(testPayload, process.env.JITSI_PRIVATE_KEY.replace(/\\n/g, '\n'), {
      algorithm: 'RS256',
      header: {
        kid: process.env.JITSI_KID,
        typ: 'JWT',
        alg: 'RS256'
      }
    });

    console.log('\n🎉 SUCCESS: JWT Generated!');
    console.log('📏 Token length:', token.length);
    console.log('🔗 Sample meeting URL:');
    console.log(`https://${process.env.JITSI_DOMAIN || '8x8.vc'}/test-room?jwt=${token.substring(0, 100)}...`);
    
  } catch (error) {
    console.log('\n❌ ERROR generating JWT:');
    console.log(error.message);
  }
} else {
  console.log('\n❌ Missing JITSI_PRIVATE_KEY');
}