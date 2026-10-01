const puppeteer = require('puppeteer'); 
(async () => { 
  const browser = await puppeteer.launch(); 
  const page = await browser.newPage(); 
  page.on('pageerror', err => console.log('CRASH:', err.toString())); 
  page.on('console', msg => console.log('LOG:', msg.text()));
  await page.goto('http://localhost:5173/track/route4_bus1'); 
  await new Promise(r => setTimeout(r, 5000)); 
  await browser.close(); 
})();
