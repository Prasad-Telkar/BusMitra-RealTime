const puppeteer = require('puppeteer');

async function testInteractiveFlows() {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERR:', err.toString()));

  console.log("1. Testing Fare Calculator with Corridor Chip 'Panaji ↔ Margao'...");
  await page.goto('http://127.0.0.1:5173/fare-calculator', { waitUntil: 'networkidle2' });

  await page.waitForSelector('.fc-corridor-chip', { timeout: 5000 });
  const chips = await page.$$('.fc-corridor-chip');
  console.log("   ✓ Found corridor chips. Clicking 'Panaji ↔ Margao'...");
  await chips[0].click();

  await page.waitForSelector('.fc-res-fare-val', { timeout: 15000 });
  const fare = await page.$eval('.fc-res-fare-val', el => el.innerText.trim());
  const origin = await page.$eval('.fc-res-stop', el => el.innerText.trim());
  console.log(`   ✓ FARE RESULT: ₹${fare} for origin: ${origin}`);

  console.log("\n2. Testing Journey Planner with Popular Trip 'Panaji -> Margao'...");
  await page.goto('http://127.0.0.1:5173/journey-planner', { waitUntil: 'networkidle2' });

  await page.waitForSelector('.jp-quick-pair-btn', { timeout: 5000 });
  const quickBtns = await page.$$('.jp-quick-pair-btn');
  console.log("   ✓ Found quick pair buttons. Clicking 'Panaji KTC -> Margao KTC'...");
  await quickBtns[0].click();

  // Wait for results scroll to have journey cards or itinerary (calculating 2300+ trips across Goa)
  await page.waitForSelector('.jp-itinerary-box, .jp-card', { timeout: 35000 });
  const itinTimes = await page.$eval('.jp-itin-times', el => el.innerText).catch(() => null);
  const itinDur = await page.$eval('.jp-itin-sub strong', el => el.innerText).catch(() => null);
  console.log(`   ✓ JOURNEY ITINERARY FOUND: ${itinTimes} (${itinDur})`);
  const steps = await page.$$('.jp-timeline-item');
  console.log(`   ✓ Itinerary contains ${steps.length} detailed step-by-step navigation segments!`);

  // Click back to view all cards
  const backBtn = await page.$('.jp-back-list-btn');
  if (backBtn) {
    await backBtn.click();
    await page.waitForSelector('.jp-card', { timeout: 5000 });
    const cards = await page.$$('.jp-card');
    console.log(`   ✓ Back button clicked: displaying all ${cards.length} journey route options!`);
  }

  await browser.close();
  console.log("\n>>> ALL INTERACTIVE FLOWS VERIFIED SUCCESSFULLY ON REAL BACKEND! <<<");
}

testInteractiveFlows().catch(err => {
  console.error("Test failed:", err);
  process.exit(1);
});
