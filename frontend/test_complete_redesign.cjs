const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const ARTIFACT_DIR = path.resolve('C:/Users/prasa/.gemini/antigravity-ide/brain/e18bebc4-101c-4f45-821e-05aabdd2fec2');

async function testAllPages() {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  const errors = [];

  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('BROWSER ERROR:', msg.text());
    }
  });

  page.on('pageerror', err => {
    console.log('PAGE EXCEPTION:', err.toString());
    errors.push(err.toString());
  });

  const urls = [
    { name: 'homepage', path: '/', viewports: [{ w: 1280, h: 800 }, { w: 390, h: 844 }] },
    { name: 'passenger_home', path: '/passenger', viewports: [{ w: 1280, h: 800 }, { w: 390, h: 844 }] },
    { name: 'journey_planner', path: '/journey-planner', viewports: [{ w: 1280, h: 800 }, { w: 390, h: 844 }] },
    { name: 'fare_calculator', path: '/fare-calculator', viewports: [{ w: 1280, h: 800 }, { w: 390, h: 844 }] },
    { name: 'stops', path: '/stops', viewports: [{ w: 1280, h: 800 }, { w: 390, h: 844 }] },
    { name: 'stop_detail', path: '/stop/KTCL-001', viewports: [{ w: 1280, h: 800 }, { w: 390, h: 844 }] },
    { name: 'routes', path: '/routes', viewports: [{ w: 1280, h: 800 }, { w: 390, h: 844 }] },
    { name: 'saved', path: '/saved', viewports: [{ w: 1280, h: 800 }, { w: 390, h: 844 }] },
    { name: 'driver', path: '/driver', viewports: [{ w: 390, h: 844 }] },
    { name: 'admin', path: '/admin', viewports: [{ w: 1280, h: 800 }] },
  ];

  console.log("Beginning automated validation across all pages...");

  for (const item of urls) {
    for (const vp of item.viewports) {
      await page.setViewport({ width: vp.w, height: vp.h, deviceScaleFactor: 2 });
      const targetUrl = `http://127.0.0.1:5173${item.path}`;
      console.log(`Testing ${item.name} at ${vp.w}px -> ${targetUrl}`);
      
      await page.goto(targetUrl, { waitUntil: 'networkidle2', timeout: 20000 });
      await new Promise(r => setTimeout(r, 800)); // wait for transitions

      // Check horizontal overflow
      const overflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth;
      });

      if (overflow) {
        console.warn(`WARNING: Horizontal overflow detected on ${item.name} at ${vp.w}px!`);
      } else {
        console.log(`✓ No horizontal overflow on ${item.name} (${vp.w}px)`);
      }

      const screenshotName = `redesign_${item.name}_${vp.w}px.png`;
      const screenshotPath = path.join(ARTIFACT_DIR, screenshotName);
      await page.screenshot({ path: screenshotPath, fullPage: false });
      console.log(`Saved screenshot: ${screenshotName}`);
    }
  }

  // Interactive flow test: Fare Calculator
  console.log("\n--- Testing Fare Calculator Interactive Flow ---");
  await page.setViewport({ width: 1280, height: 800 });
  await page.goto('http://127.0.0.1:5173/fare-calculator', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 500));

  // Type into origin input
  const inputs = await page.$$('.fc-search-wrapper input');
  if (inputs.length >= 2) {
    await inputs[0].click();
    await inputs[0].type('Panaji', { delay: 50 });
    await new Promise(r => setTimeout(r, 600));

    // Click first suggestion if available
    const suggs = await page.$$('.fc-autocomplete-item');
    if (suggs.length > 0) {
      await suggs[0].click();
      console.log("✓ Selected origin stop");
    }

    await inputs[1].click();
    await inputs[1].type('Margao', { delay: 50 });
    await new Promise(r => setTimeout(r, 600));

    const suggs2 = await page.$$('.fc-autocomplete-item');
    if (suggs2.length > 0) {
      await suggs2[0].click();
      console.log("✓ Selected destination stop");
    }

    // Click calculate
    const calcBtn = await page.$('.fc-calc-btn');
    if (calcBtn) {
      await calcBtn.click();
      console.log("✓ Clicked Calculate Fare");
      await new Promise(r => setTimeout(r, 1500));

      const fareText = await page.evaluate(() => {
        const fare = document.querySelector('.fc-res-fare-val');
        return fare ? fare.innerText : null;
      });
      console.log(`Fare calculation result: ${fareText}`);
    }
  }

  // Interactive flow test: Journey Planner
  console.log("\n--- Testing Journey Planner Autocomplete & Search ---");
  await page.goto('http://127.0.0.1:5173/journey-planner', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 800));

  const quickBtns = await page.$$('.jp-quick-pair-btn');
  if (quickBtns.length > 0) {
    console.log("Clicking quick trip pair 'Panaji -> Margao'...");
    await quickBtns[0].click();
    await new Promise(r => setTimeout(r, 2000));

    const countText = await page.evaluate(() => {
      const el = document.querySelector('.jp-results-count') || document.querySelector('.jp-error-state') || document.querySelector('.jp-empty-state');
      return el ? el.innerText : null;
    });
    console.log(`Journey search response: ${countText}`);

    // If journey cards rendered, click first to see itinerary
    const jCards = await page.$$('.jp-card');
    if (jCards.length > 0) {
      await jCards[0].click();
      await new Promise(r => setTimeout(r, 600));
      console.log("✓ Selected first journey card, inspecting itinerary steps");
      await page.screenshot({ path: path.join(ARTIFACT_DIR, 'journey_planner_itinerary.png') });
    }
  }

  await browser.close();
  console.log("\nAll automated tests completed!");
  if (errors.length > 0) {
    console.error(`Encountered ${errors.length} page errors:`, errors);
  } else {
    console.log("✓ ZERO browser exceptions encountered across all pages!");
  }
}

testAllPages().catch(console.error);
