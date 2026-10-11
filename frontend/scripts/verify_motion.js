const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const ARTIFACT_DIR = 'C:/Users/ishaa/.gemini/antigravity/brain/7fa2091a-8893-40fb-a1d3-3c1e2df418cb';
const VIDEO_DIR = path.join(ARTIFACT_DIR, 'videos');
if (!fs.existsSync(VIDEO_DIR)) {
  fs.mkdirSync(VIDEO_DIR, { recursive: true });
}

async function runMotionVerification() {
  console.log('--- Starting Motion Verification ---');
  const browser = await chromium.launch();

  // 1. HERO ENTRANCE FRAME EXTRACTION (6-8 frames)
  console.log('Capturing Hero entrance sequential frames...');
  {
    const context = await browser.newContext({
      viewport: { width: 1280, height: 900 }
    });
    const page = await context.newPage();
    
    // We navigate to / and capture frames at specific checkpoints
    await page.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded' });
    
    const checkpoints = [
      { name: 'hero_frame_1_0ms', delay: 0 },
      { name: 'hero_frame_2_120ms', delay: 120 },
      { name: 'hero_frame_3_240ms', delay: 120 },
      { name: 'hero_frame_4_380ms', delay: 140 },
      { name: 'hero_frame_5_520ms', delay: 140 },
      { name: 'hero_frame_6_700ms', delay: 180 },
      { name: 'hero_frame_7_900ms', delay: 200 },
      { name: 'hero_frame_8_1200ms', delay: 300 },
    ];

    for (const cp of checkpoints) {
      if (cp.delay > 0) {
        await page.waitForTimeout(cp.delay);
      }
      const framePath = path.join(ARTIFACT_DIR, `${cp.name}.png`);
      await page.screenshot({ path: framePath, clip: { x: 0, y: 0, width: 1280, height: 800 } });
      console.log(`Saved frame: ${cp.name}`);
    }
    await context.close();
  }

  // 2. PERFORMANCE & CLS MEASUREMENT (Standard & 375px throttled CPU 4x)
  console.log('Measuring performance metrics (CLS, LCP)...');
  let desktopPerf = {};
  {
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const page = await context.newPage();
    await page.goto('http://localhost:3000/', { waitUntil: 'load' });
    desktopPerf = await page.evaluate(() => {
      return new Promise((resolve) => {
        let cls = 0;
        let lcp = 0;
        try {
          new PerformanceObserver((entryList) => {
            for (const entry of entryList.getEntries()) {
              if (!entry.hadRecentInput) {
                cls += entry.value;
              }
            }
          }).observe({ type: 'layout-shift', buffered: true });

          new PerformanceObserver((entryList) => {
            const entries = entryList.getEntries();
            if (entries.length > 0) {
              lcp = entries[entries.length - 1].startTime;
            }
          }).observe({ type: 'largest-contentful-paint', buffered: true });
        } catch (e) {}

        setTimeout(() => {
          resolve({ cls: Number(cls.toFixed(4)), lcp: Math.round(lcp) });
        }, 2000);
      });
    });
    console.log('Desktop Perf:', desktopPerf);
    await context.close();
  }

  let mobilePerfThrottled = {};
  {
    const context = await browser.newContext({ viewport: { width: 375, height: 812 } });
    const page = await context.newPage();
    const client = await context.newCDPSession(page);
    await client.send('Emulation.setCPUThrottlingRate', { rate: 4 });

    await page.goto('http://localhost:3000/', { waitUntil: 'load' });
    mobilePerfThrottled = await page.evaluate(() => {
      return new Promise((resolve) => {
        let cls = 0;
        let lcp = 0;
        try {
          new PerformanceObserver((entryList) => {
            for (const entry of entryList.getEntries()) {
              if (!entry.hadRecentInput) {
                cls += entry.value;
              }
            }
          }).observe({ type: 'layout-shift', buffered: true });

          new PerformanceObserver((entryList) => {
            const entries = entryList.getEntries();
            if (entries.length > 0) {
              lcp = entries[entries.length - 1].startTime;
            }
          }).observe({ type: 'largest-contentful-paint', buffered: true });
        } catch (e) {}

        setTimeout(() => {
          resolve({ cls: Number(cls.toFixed(4)), lcp: Math.round(lcp) });
        }, 2000);
      });
    });
    console.log('Mobile (375px throttled CPU 4x) Perf:', mobilePerfThrottled);
    await context.close();
  }

  // 3. FULL WALKTHROUGH VIDEO (Landing -> Scroll -> Button Hover -> /run -> Live Run -> Results)
  console.log('Recording Full Walkthrough Video...');
  let fullWalkthroughVideoPath = '';
  {
    const context = await browser.newContext({
      viewport: { width: 1280, height: 900 },
      recordVideo: { dir: VIDEO_DIR, size: { width: 1280, height: 900 } }
    });
    const page = await context.newPage();

    // 1. Landing load
    await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000); // observe hero entrance

    // 2. Hover on hero CTA
    const heroCta = page.getByRole('link', { name: /Run simulation/i }).first();
    await heroCta.hover();
    await page.waitForTimeout(600);

    // 3. Slow scroll through every section
    // Scroll to fact strip
    await page.evaluate(() => window.scrollTo({ top: 550, behavior: 'smooth' }));
    await page.waitForTimeout(1200);

    // Hover on marquee (force: true because continuous CSS marquee is constantly in motion)
    const marquee = page.locator('.animate-marquee').first();
    if (await marquee.count() > 0) {
      await marquee.hover({ force: true });
      await page.waitForTimeout(800);
    }

    // Scroll to How It Works
    await page.evaluate(() => window.scrollTo({ top: 1100, behavior: 'smooth' }));
    await page.waitForTimeout(1200);

    // Scroll to Sample Result Card
    await page.evaluate(() => window.scrollTo({ top: 1950, behavior: 'smooth' }));
    await page.waitForTimeout(1500);

    // Scroll to Final CTA
    await page.evaluate(() => window.scrollTo({ top: 2750, behavior: 'smooth' }));
    await page.waitForTimeout(1500);

    // 4. Click CTA into /run
    const finalCta = page.getByRole('link', { name: /Run simulation/i }).last();
    await finalCta.click();
    await page.waitForURL('**/run');
    await page.waitForTimeout(800);

    // 5. Select sample pitch & run live simulation
    const sampleChip = page.getByRole('button', { name: /KavachHydrate/i });
    await sampleChip.click();
    await page.waitForTimeout(500);

    const runBtn = page.getByRole('button', { name: /Run the Focus Group/i });
    await runBtn.click();

    // Wait through processing
    console.log('Waiting for live simulation to process...');
    await page.waitForSelector('text=Live Evaluations', { timeout: 15000 });
    
    // Wait until results view loads (up to 120s for live run)
    await page.waitForSelector('text=The Room Has Spoken', { timeout: 120000 });
    console.log('Results loaded in live simulation!');
    await page.waitForTimeout(3000); // observe count-ups, score bars, playbook

    const videoObj = await page.video();
    fullWalkthroughVideoPath = await videoObj.path();
    await context.close();
  }

  // Rename full walkthrough video
  const targetWalkthroughPath = path.join(VIDEO_DIR, 'landing_and_run_walkthrough.webm');
  if (fs.existsSync(targetWalkthroughPath)) fs.unlinkSync(targetWalkthroughPath);
  fs.renameSync(fullWalkthroughVideoPath, targetWalkthroughPath);
  console.log('Walkthrough video saved at:', targetWalkthroughPath);

  // 4. REDUCED MOTION VIDEO (Landing page with prefers-reduced-motion)
  console.log('Recording Reduced Motion Landing Video...');
  let reducedVideoPath = '';
  {
    const context = await browser.newContext({
      viewport: { width: 1280, height: 900 },
      reducedMotion: 'reduce',
      recordVideo: { dir: VIDEO_DIR, size: { width: 1280, height: 900 } }
    });
    const page = await context.newPage();

    await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    // Scroll through all sections
    await page.evaluate(() => window.scrollTo({ top: 600, behavior: 'smooth' }));
    await page.waitForTimeout(800);

    await page.evaluate(() => window.scrollTo({ top: 1200, behavior: 'smooth' }));
    await page.waitForTimeout(800);

    await page.evaluate(() => window.scrollTo({ top: 2000, behavior: 'smooth' }));
    await page.waitForTimeout(800);

    await page.evaluate(() => window.scrollTo({ top: 2800, behavior: 'smooth' }));
    await page.waitForTimeout(1000);

    const videoObj = await page.video();
    reducedVideoPath = await videoObj.path();
    await context.close();
  }

  const targetReducedPath = path.join(VIDEO_DIR, 'landing_reduced_motion.webm');
  if (fs.existsSync(targetReducedPath)) fs.unlinkSync(targetReducedPath);
  fs.renameSync(reducedVideoPath, targetReducedPath);
  console.log('Reduced motion video saved at:', targetReducedPath);

  // Save report data
  fs.writeFileSync(
    path.join(ARTIFACT_DIR, 'motion_perf_summary.json'),
    JSON.stringify({
      desktopPerf,
      mobilePerfThrottled,
      targetWalkthroughPath,
      targetReducedPath
    }, null, 2)
  );

  await browser.close();
  console.log('--- Motion Verification Complete ---');
}

runMotionVerification().catch(err => {
  console.error('Motion verification failed:', err);
  process.exit(1);
});
