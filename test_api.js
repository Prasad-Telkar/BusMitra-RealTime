const https = require('https');

const queries = ['ponda', 'farmagudi', 'panaji'];

queries.forEach(q => {
  https.get(`https://busmitra-goa.onrender.com/api/search/stops?q=${q}`, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      try {
        const parsed = JSON.parse(data);
        console.log(`\n--- Query: ${q} (Status: ${res.statusCode}) ---`);
        console.log(`Count: ${parsed.length}`);
        if (parsed.length > 0) {
          console.log(`First 3 stops:`);
          parsed.slice(0, 3).forEach(s => console.log(`- ${s.name} (ID: ${s.stopId || s._id}, Lat: ${s.latitude}, Lng: ${s.longitude})`));
        }
      } catch (e) {
        console.log(`Query ${q} failed to parse:`, data.slice(0, 100));
      }
    });
  }).on('error', err => console.error(err));
});
