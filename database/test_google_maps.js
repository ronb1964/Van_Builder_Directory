// Test script to verify Google Maps API key is working
const https = require('https');

const API_KEY = 'AIzaSyBX1Yk0NkpcZY7Qy7SYt2NC80b57FSjaA8';

// Test the Vanquest address specifically
const testUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent('8901 E. Ravendale Dr., Palmer, Alaska, USA')}&key=${API_KEY}`;

console.log('🧪 Testing Vanquest address...');
console.log('Address: 8901 E. Ravendale Dr., Palmer, Alaska, USA');
console.log('Test URL:', testUrl);

https.get(testUrl, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const response = JSON.parse(data);
      console.log('📍 API Response Status:', response.status);
      
      if (response.status === 'OK') {
        console.log('✅ Address found!');
        console.log('📍 Coordinates:', response.results[0]?.geometry?.location);
        console.log('📍 Formatted address:', response.results[0]?.formatted_address);
      } else {
        console.log('❌ API Error:', response.status);
        console.log('📝 Error message:', response.error_message || 'No error message');
        
        // Try just Palmer, Alaska as fallback
        console.log('\n🔄 Trying fallback: Palmer, Alaska...');
        const fallbackUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent('Palmer, Alaska, USA')}&key=${API_KEY}`;
        
        https.get(fallbackUrl, (res2) => {
          let data2 = '';
          res2.on('data', (chunk) => data2 += chunk);
          res2.on('end', () => {
            const response2 = JSON.parse(data2);
            if (response2.status === 'OK') {
              console.log('✅ Fallback successful!');
              console.log('📍 Palmer coordinates:', response2.results[0]?.geometry?.location);
            }
          });
        });
      }
    } catch (error) {
      console.log('❌ Error parsing response:', error.message);
    }
  });
}).on('error', (error) => {
  console.log('❌ Network error:', error.message);
});
