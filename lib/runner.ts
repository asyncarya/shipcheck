import { chromium, Browser, BrowserContext, Page } from 'playwright';
import { runStore } from './runStore';
import { TestPlan, TestStep, StepResult, Evidence } from './schemas';
import path from 'path';
import fs from 'fs';

// Helper to resolve an element for click actions using fallbacks
async function findClickableElement(page: Page, target: string) {
  const cleanTarget = target.trim();
  
  // 1. Try accessible role button or link with name
  try {
    const btn = page.getByRole('button', { name: cleanTarget, exact: false });
    if (await btn.count() > 0 && await btn.first().isVisible()) return btn.first();
  } catch {}
  
  try {
    const link = page.getByRole('link', { name: cleanTarget, exact: false });
    if (await link.count() > 0 && await link.first().isVisible()) return link.first();
  } catch {}

  // 2. Try by visible text
  try {
    const txt = page.getByText(cleanTarget, { exact: false });
    if (await txt.count() > 0 && await txt.first().isVisible()) return txt.first();
  } catch {}

  // 3. Try standard CSS selector
  try {
    const sel = page.locator(cleanTarget);
    if (await sel.count() > 0 && await sel.first().isVisible()) return sel.first();
  } catch {}

  // 4. Try common test attributes or values
  try {
    const attr = page.locator(`[value="${cleanTarget}"], [aria-label="${cleanTarget}"], [title="${cleanTarget}"]`);
    if (await attr.count() > 0 && await attr.first().isVisible()) return attr.first();
  } catch {}

  throw new Error(`Click target "${target}" not found or is not visible.`);
}

// Helper to resolve an element for fill/input actions
async function findInputElement(page: Page, field: string) {
  const cleanField = field.trim();

  // 1. Try getByLabel
  try {
    const label = page.getByLabel(cleanField, { exact: false });
    if (await label.count() > 0 && await label.first().isVisible()) return label.first();
  } catch {}

  // 2. Try getByPlaceholder
  try {
    const placeholder = page.getByPlaceholder(cleanField, { exact: false });
    if (await placeholder.count() > 0 && await placeholder.first().isVisible()) return placeholder.first();
  } catch {}

  // 3. Try name, id, or selector
  try {
    const sel = page.locator(`input[name="${cleanField}"], textarea[name="${cleanField}"], input[id="${cleanField}"], textarea[id="${cleanField}"]`);
    if (await sel.count() > 0 && await sel.first().isVisible()) return sel.first();
  } catch {}

  // 4. Try general selector fallback
  try {
    const general = page.locator(cleanField);
    if (await general.count() > 0 && await general.first().isVisible()) return general.first();
  } catch {}

  throw new Error(`Input field "${field}" not found or is not visible.`);
}

async function captureLivePreview(page: Page | null, runId: string): Promise<void> {
  if (!page || page.isClosed()) return;
  try {
    const screenshotsDir = path.join(process.cwd(), 'public', 'screenshots');
    const screenshotFileName = `${runId}-live.jpg`;
    const screenshotPath = path.join(screenshotsDir, screenshotFileName);
    
    await page.screenshot({ path: screenshotPath, type: 'jpeg', quality: 50 }); // lower quality for fast capture
    const webScreenshotPath = `/screenshots/${screenshotFileName}`;
    await runStore.updateRun(runId, { latestScreenshotPath: webScreenshotPath });
  } catch (err) {
    console.error(`[Runner] Live preview screenshot capture failed:`, err);
  }
}

export async function runBrowserTest(runId: string, startUrl: string, plan: TestPlan): Promise<void> {
  const screenshotsDir = path.join(process.cwd(), 'public', 'screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  // Create initial run progress structure
  const totalSteps = plan.steps.length;
  await runStore.updateRun(runId, {
    status: 'running',
    progress: 5,
    steps: plan.steps.map(step => ({
      stepId: step.id,
      status: 'pending',
    })),
  });

  let browser: Browser | null = null;
  let context: BrowserContext | null = null;
  let page: Page | null = null;

  try {
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    context = await browser.newContext({
      viewport: { width: 1280, height: 720 },
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 ShipCheckRunner/1.0',
    });

    // Enforce total test timeout
    const testTimeout = setTimeout(async () => {
      console.log(`[Runner] Test run ${runId} timed out.`);
      runStore.updateRun(runId, { status: 'timed_out', errorMessage: 'Test run exceeded maximum limit of 60 seconds.' });
      if (browser) {
        await browser.close().catch(() => {});
      }
    }, 60000);

    page = await context.newPage();

    // Attach listeners for console and network errors
    page.on('console', async (msg) => {
      const type = msg.type();
      if (type === 'error' || type === 'warning') {
        await runStore.addConsoleError(runId, {
          type,
          text: msg.text(),
          timestamp: new Date().toISOString(),
        });
      }
    });

    page.on('pageerror', async (error) => {
      await runStore.addConsoleError(runId, {
        type: 'page_error',
        text: error.message || String(error),
        timestamp: new Date().toISOString(),
      });
    });

    page.on('requestfailed', async (request) => {
      const failure = request.failure();
      const failureText = failure ? failure.errorText : 'Unknown failure';
      // Only capture critical file errors or API failures
      if (request.resourceType() === 'fetch' || request.resourceType() === 'xhr' || request.resourceType() === 'document') {
        await runStore.addConsoleError(runId, {
          type: 'network_error',
          text: `Failed to load ${request.method()} ${request.url()} - ${failureText}`,
          timestamp: new Date().toISOString(),
        });
      }
    });

    // Capture server-side API internal server errors (500s)
    page.on('response', async (response) => {
      if (response.status() >= 500) {
        await runStore.addConsoleError(runId, {
          type: 'server_error',
          text: `Response ${response.status()} from ${response.request().method()} ${response.url()}`,
          timestamp: new Date().toISOString(),
        });
      }
    });

    let stepIndex = 0;
    let runFailed = false;

    for (const step of plan.steps) {
      if (runFailed) {
        // Mark skipped
        await runStore.addStepResult(runId, {
          stepId: step.id,
          status: 'skipped',
        });
        continue;
      }

      console.log(`[Runner] Executing step ${step.id}: ${step.description}`);
      const startTime = Date.now();

      // Update state to running
      await runStore.addStepResult(runId, {
        stepId: step.id,
        status: 'running',
      });
      if (stepIndex > 0) {
        await captureLivePreview(page, runId);
      }
      
      const currentProgress = Math.round(5 + (stepIndex / totalSteps) * 90);
      await runStore.updateRun(runId, { progress: currentProgress });

      try {
        // Enforce 15s timeout per step
        await page.waitForTimeout(200); // Small breath before action

        switch (step.action) {
          case 'navigate': {
            let targetUrl = step.target || '';
            if (targetUrl.startsWith('/')) {
              // Convert absolute path to full url based on current site, or base url
              const base = new URL(startUrl);
              targetUrl = `${base.protocol}//${base.host}${targetUrl}`;
            } else if (!/^https?:\/\//i.test(targetUrl)) {
              // Fallback if AI forgot protocol
              targetUrl = `https://${targetUrl}`;
            }

            await page.goto(targetUrl, { waitUntil: 'load', timeout: 15000 });
            await captureLivePreview(page, runId);
            break;
          }

          case 'fill': {
            const fieldLocator = await findInputElement(page, step.field || '');
            await fieldLocator.focus({ timeout: 15000 });
            await captureLivePreview(page, runId);
            await fieldLocator.fill(step.value || '', { timeout: 15000 });
            await captureLivePreview(page, runId);
            break;
          }

          case 'click': {
            const clickLocator = await findClickableElement(page, step.target || '');
            await clickLocator.click({ timeout: 15000 });
            await page.waitForTimeout(400); // Allow navigation or UI transition to begin
            await captureLivePreview(page, runId);
            break;
          }

          case 'verify': {
            const textToFind = step.target || '';
            
            // Wait for text to appear on page (timeout 15s)
            let found = false;
            try {
              await page.waitForFunction((txt) => {
                return document.body.innerText.includes(txt);
              }, textToFind, { timeout: 15000 });
              found = true;
            } catch {
              // Try finding as CSS element selector and fetching text content
              try {
                const el = page.locator(textToFind);
                if (await el.count() > 0 && await el.first().isVisible()) {
                  found = true;
                }
              } catch {}
            }

            if (!found) {
              throw new Error(`Expected text or element "${textToFind}" was not found on the page.`);
            }
            await captureLivePreview(page, runId);
            break;
          }

          default:
            throw new Error(`Unsupported action: ${step.action}`);
        }

        // Action passed!
        const duration = Date.now() - startTime;
        
        // Take screenshot
        const screenshotFileName = `${runId}-${step.id}.jpg`;
        const screenshotPath = path.join(screenshotsDir, screenshotFileName);
        await page.screenshot({ path: screenshotPath, type: 'jpeg', quality: 80 });

        const webScreenshotPath = `/screenshots/${screenshotFileName}`;

        await runStore.addStepResult(runId, {
          stepId: step.id,
          status: 'passed',
          durationMs: duration,
          screenshotPath: webScreenshotPath,
          url: page.url(),
        });

        // Add to general evidence
        await runStore.addEvidence(runId, {
          id: `evidence-${step.id}-passed`,
          stepId: step.id,
          type: 'screenshot',
          value: webScreenshotPath,
          timestamp: new Date().toISOString(),
        });

        await runStore.addEvidence(runId, {
          id: `evidence-${step.id}-url`,
          stepId: step.id,
          type: 'url',
          value: page.url(),
          timestamp: new Date().toISOString(),
        });

      } catch (stepError: any) {
        console.error(`[Runner] Step ${step.id} failed:`, stepError.message);
        runFailed = true;

        const duration = Date.now() - startTime;
        
        // Try to capture error screenshot
        let webScreenshotPath = '';
        try {
          const screenshotFileName = `${runId}-${step.id}-fail.jpg`;
          const screenshotPath = path.join(screenshotsDir, screenshotFileName);
          await page.screenshot({ path: screenshotPath, type: 'jpeg', quality: 80 });
          webScreenshotPath = `/screenshots/${screenshotFileName}`;
        } catch (screenshotError) {
          console.error('[Runner] Failed to take failure screenshot:', screenshotError);
        }

        // Save current HTML context (text around the element)
        let pageText = '';
        try {
          pageText = await page.evaluate(() => document.body.innerText.slice(0, 2000));
        } catch {}

        await runStore.addStepResult(runId, {
          stepId: step.id,
          status: 'failed',
          durationMs: duration,
          error: stepError.message || String(stepError),
          screenshotPath: webScreenshotPath || undefined,
          url: page.url(),
        });

        if (webScreenshotPath) {
          await runStore.addEvidence(runId, {
            id: `evidence-${step.id}-fail-screenshot`,
            stepId: step.id,
            type: 'screenshot',
            value: webScreenshotPath,
            timestamp: new Date().toISOString(),
          });
        }

        if (pageText) {
          await runStore.addEvidence(runId, {
            id: `evidence-${step.id}-fail-text`,
            stepId: step.id,
            type: 'text',
            value: pageText,
            timestamp: new Date().toISOString(),
          });
        }

        await runStore.addEvidence(runId, {
          id: `evidence-${step.id}-fail-url`,
          stepId: step.id,
          type: 'url',
          value: page.url(),
          timestamp: new Date().toISOString(),
        });
      }

      stepIndex++;
    }

    clearTimeout(testTimeout);

    // Set overall status based on results
    const finalRun = await runStore.getRun(runId);
    if (finalRun && finalRun.status !== 'timed_out') {
      const hasFailedStep = finalRun.steps.some(s => s.status === 'failed');
      await runStore.updateRun(runId, {
        status: hasFailedStep ? 'failed' : 'passed',
        progress: 100,
        finishedAt: new Date().toISOString(),
      });
    }

  } catch (launchError: any) {
    console.error('[Runner] Browser execution error:', launchError);
    await runStore.updateRun(runId, {
      status: 'error',
      errorMessage: launchError.message || 'An unexpected error occurred during browser execution.',
      progress: 100,
      finishedAt: new Date().toISOString(),
    });
  } finally {
    if (browser) {
      await browser.close().catch(() => {});
    }
  }
}
