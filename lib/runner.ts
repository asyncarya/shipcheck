import { chromium, Browser, BrowserContext, Page } from 'playwright';
import { runStore } from './runStore';
import { TestPlan, TestStep, StepResult, Evidence } from './schemas';
import { openai } from './openai';
import path from 'path';
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

async function saveScreenshot(page: Page, runId: string, stepId: string, isLive: boolean = false): Promise<string> {
  const fileName = isLive ? `${runId}-live.jpg` : `${runId}-${stepId}.jpg`;
  
  if (supabaseUrl && supabaseAnonKey) {
    try {
      const buffer = await page.screenshot({ type: 'jpeg', quality: isLive ? 50 : 80 });
      const supabase = createClient(supabaseUrl, supabaseAnonKey);
      
      const { error } = await supabase.storage
        .from('evidence')
        .upload(`${runId}/${fileName}`, buffer, {
          contentType: 'image/jpeg',
          upsert: true
        });
        
      if (error) throw error;
      
      const { data: { publicUrl } } = supabase.storage
        .from('evidence')
        .getPublicUrl(`${runId}/${fileName}`);
        
      return publicUrl;
    } catch (uploadError) {
      console.error('[Runner] Supabase Storage upload failed, falling back to local storage:', uploadError);
    }
  }

  // Fallback to local on-disk storage (local sandbox mode)
  try {
    const screenshotsDir = path.join(process.cwd(), 'public', 'screenshots');
    if (!fs.existsSync(screenshotsDir)) {
      fs.mkdirSync(screenshotsDir, { recursive: true });
    }
    const screenshotPath = path.join(screenshotsDir, fileName);
    await page.screenshot({ path: screenshotPath, type: 'jpeg', quality: isLive ? 50 : 80 });
    return `/screenshots/${fileName}`;
  } catch (localError) {
    console.error('[Runner] Local screenshot storage failed:', localError);
    return '';
  }
}

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

  // 5. Smart submit button heuristic: if target looks like a submit command
  const targetLower = cleanTarget.toLowerCase();
  if (targetLower.includes('submit') || targetLower.includes('send') || targetLower.includes('form') || targetLower.includes('button')) {
    try {
      const submitBtn = page.locator('button[type="submit"], input[type="submit"]');
      if (await submitBtn.count() > 0 && await submitBtn.first().isVisible()) {
        return submitBtn.first();
      }
    } catch {}
    
    // Also try checking for any button containing common submit terms (case-insensitive)
    try {
      const buttons = page.locator('button, input[type="button"], [role="button"]');
      const count = await buttons.count();
      const commonSubmitTexts = ['send', 'submit', 'message', 'save', 'next', 'confirm', 'go', 'post', 'connect'];
      for (let i = 0; i < count; i++) {
        const el = buttons.nth(i);
        if (await el.isVisible() && await el.isEnabled()) {
          const btnText = (await el.innerText() || await el.getAttribute('value') || '').toLowerCase();
          if (commonSubmitTexts.some(txt => btnText.includes(txt))) {
            return el;
          }
        }
      }
    } catch {}
  }

  // 6. General fallback: scan all buttons for containing the text string anywhere
  try {
    const buttons = page.locator('button, a, input[type="button"], input[type="submit"], [role="button"]');
    const count = await buttons.count();
    const term = cleanTarget.toLowerCase();
    for (let i = 0; i < count; i++) {
      const el = buttons.nth(i);
      if (await el.isVisible() && await el.isEnabled()) {
        const text = (await el.innerText() || await el.getAttribute('value') || '').toLowerCase();
        if (text.includes(term)) {
          return el;
        }
      }
    }
  } catch {}

  throw new Error(`Click target "${target}" not found or is not visible.`);
}

// Helper to resolve an element for fill/input actions
// Helper to resolve an element for fill/input actions without self-healing fallback
async function locateInputRaw(page: Page, cleanField: string) {
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

  // 5. Smart heuristic attribute scanning: scan visible inputs for partial attribute matches
  try {
    const inputs = page.locator('input, textarea, select');
    const count = await inputs.count();
    const term = cleanField.toLowerCase();
    for (let i = 0; i < count; i++) {
      const el = inputs.nth(i);
      if (await el.isVisible() && await el.isEnabled()) {
        const name = (await el.getAttribute('name') || '').toLowerCase();
        const id = (await el.getAttribute('id') || '').toLowerCase();
        const placeholder = (await el.getAttribute('placeholder') || '').toLowerCase();
        const ariaLabel = (await el.getAttribute('aria-label') || '').toLowerCase();
        
        if (name.includes(term) || id.includes(term) || placeholder.includes(term) || ariaLabel.includes(term)) {
          return el;
        }
      }
    }
  } catch {}

  // 6. Generic empty field fallback: pick first visible unfilled input/textarea
  try {
    const inputs = page.locator('input:not([type="submit"]):not([type="button"]):not([type="hidden"]), textarea');
    const count = await inputs.count();
    for (let i = 0; i < count; i++) {
      const el = inputs.nth(i);
      if (await el.isVisible() && await el.isEnabled()) {
        const val = await el.inputValue();
        if (!val) {
          return el;
        }
      }
    }
  } catch {}

  return null;
}

async function getVisiblePageErrors(page: Page): Promise<string[]> {
  const errors: string[] = [];
  try {
    // 1. Selector-based scan for explicit error controls
    const errorLocators = page.locator('[role="alert"], [class*="error" i], [class*="warning" i], [class*="feedback" i], [class*="alert" i]');
    const count = await errorLocators.count();
    for (let i = 0; i < count; i++) {
      const el = errorLocators.nth(i);
      if (await el.isVisible()) {
        const text = (await el.innerText()).trim();
        if (text && text.length > 5 && text.length < 300 && !errors.includes(text)) {
          errors.push(text);
        }
      }
    }

    // 2. Content-based scan for common error warning text
    const textLocators = page.locator('p, div, span, label');
    const txtCount = await textLocators.count();
    const errorKeywords = ["linked", "incorrect", "invalid", "not found", "required", "please check", "doesn't exist", "cannot find", "credentials"];
    for (let i = 0; i < txtCount; i++) {
      const el = textLocators.nth(i);
      if (await el.isVisible()) {
        const text = (await el.innerText()).trim();
        if (text && text.length > 5 && text.length < 250) {
          const lower = text.toLowerCase();
          if (errorKeywords.some(kw => lower.includes(kw)) && !errors.includes(text)) {
            errors.push(text);
          }
        }
      }
    }
  } catch (err) {
    console.warn('[Runner] Failed to scan DOM for error messages:', err);
  }
  return errors;
}

function isSocialProviderButton(text: string): boolean {
  return text.includes('google') || 
         text.includes('microsoft') || 
         text.includes('apple') || 
         text.includes('facebook') || 
         text.includes('github') || 
         text.includes('linkedin') || 
         text.includes('sso') || 
         text.includes('okta') || 
         text.includes('passkey') || 
         text.includes('yahoo') || 
         text.includes('twitter');
}

// Helper to resolve an element for fill/input actions (with multi-step transition fallback)
async function findInputElement(page: Page, field: string) {
  const cleanField = field.trim();

  // Try locating it immediately
  let element = await locateInputRaw(page, cleanField);
  if (element) return element;

  // Self-healing: if element is not found, check if we are stuck on a multi-step form screen
  try {
    // 1. Try filling any empty required fields (like email/username) that might have been cleared or missed
    if (cleanField.toLowerCase() === 'password') {
      const emailInput = await locateInputRaw(page, 'email');
      if (emailInput) {
        const currentEmailVal = await emailInput.inputValue().catch(() => '');
        if (!currentEmailVal) {
          console.log('[Runner] Email field was empty. Re-filling email before transition.');
          await emailInput.fill('test-user@example.com');
        }
      }
    }

    const transitionButtons = page.locator('button, input[type="button"], input[type="submit"], [role="button"]');
    const count = await transitionButtons.count();
    let clickedTransition = false;

    for (let i = 0; i < count; i++) {
      const el = transitionButtons.nth(i);
      if (await el.isVisible() && await el.isEnabled()) {
        const text = (await el.innerText() || await el.getAttribute('value') || '').toLowerCase();
        
        // Skip third-party/SSO/social provider login buttons to avoid triggering external redirects
        if (isSocialProviderButton(text)) {
          continue;
        }

        if (
          text.includes('continue') || 
          text.includes('next') || 
          text.includes('proceed') || 
          text.includes('submit') || 
          text.includes('log in') || 
          text.includes('sign in')
        ) {
          console.log(`[Runner] Multi-step flow detected. Attempting to click transition button: "${text.trim()}"`);
          await el.click();
          clickedTransition = true;
          break;
        }
      }
    }

    if (clickedTransition) {
      // Poll for the input field to appear (up to 5 seconds, checking every 500ms)
      for (let attempt = 0; attempt < 10; attempt++) {
        await page.waitForTimeout(500);
        element = await locateInputRaw(page, cleanField);
        if (element) {
          console.log(`[Runner] Found input field "${cleanField}" after form transition.`);
          return element;
        }
      }

      // 2. If it's still not found, and the email field got reset/cleared during the transition,
      // re-fill the email and click the transition button one more time!
      if (cleanField.toLowerCase() === 'password') {
        const emailInput = await locateInputRaw(page, 'email');
        if (emailInput) {
          const currentEmailVal = await emailInput.inputValue().catch(() => '');
          if (!currentEmailVal) {
            console.log('[Runner] Password not found and email was cleared. Executing second-pass re-fill.');
            await emailInput.fill('test-user@example.com');
            
            // Re-click the transition button
            for (let i = 0; i < count; i++) {
              const el = transitionButtons.nth(i);
              if (await el.isVisible() && await el.isEnabled()) {
                const text = (await el.innerText() || '').toLowerCase();
                if (
                  (text.includes('continue') || text.includes('next') || text.includes('proceed') || text.includes('submit')) &&
                  !isSocialProviderButton(text)
                ) {
                  await el.click();
                  break;
                }
              }
            }

            // Poll one more time (up to 3 seconds)
            for (let attempt = 0; attempt < 6; attempt++) {
              await page.waitForTimeout(500);
              element = await locateInputRaw(page, cleanField);
              if (element) {
                return element;
              }
            }
          }
        }
      }
    }
  } catch (err) {
    console.warn('[Runner] Multi-step flow transition fallback check failed:', err);
  }

  const errors = await getVisiblePageErrors(page);
  if (errors.length > 0) {
    throw new Error(`Input field "${field}" not found or is not visible. Observed validation warning: "${errors.join(' | ')}"`);
  }

  throw new Error(`Input field "${field}" not found or is not visible.`);
}

async function fillAllVisibleFields(page: Page, fallbackValue: string = 'Test Value'): Promise<void> {
  const inputs = page.locator('input:not([type="submit"]):not([type="button"]):not([type="hidden"]), textarea, select');
  const count = await inputs.count();
  
  for (let i = 0; i < count; i++) {
    const el = inputs.nth(i);
    try {
      if (await el.isVisible() && await el.isEnabled()) {
        const val = await el.inputValue().catch(() => '');
        // Only fill if it's currently empty
        if (!val) {
          const name = (await el.getAttribute('name') || '').toLowerCase();
          const id = (await el.getAttribute('id') || '').toLowerCase();
          const placeholder = (await el.getAttribute('placeholder') || '').toLowerCase();
          const type = (await el.getAttribute('type') || '').toLowerCase();
          const label = (await el.getAttribute('aria-label') || '').toLowerCase();
          
          const combinedAttr = `${name} ${id} ${placeholder} ${type} ${label}`.toLowerCase();
          
          let fillVal = fallbackValue;
          if (combinedAttr.includes('email')) {
            fillVal = 'test@example.com';
          } else if (combinedAttr.includes('phone') || combinedAttr.includes('tel') || combinedAttr.includes('mobile')) {
            fillVal = '1234567890';
          } else if (combinedAttr.includes('name')) {
            fillVal = 'Test User';
          } else if (combinedAttr.includes('subject')) {
            fillVal = 'Test Subject';
          } else if (combinedAttr.includes('message') || combinedAttr.includes('textarea') || (await el.evaluate(node => node.tagName).catch(() => '')).toLowerCase() === 'textarea') {
            fillVal = 'This is a test message for form verification.';
          } else if (type === 'number') {
            fillVal = '123';
          } else if (type === 'url') {
            fillVal = 'https://example.com';
          }
          
          const tagName = (await el.evaluate(node => node.tagName).catch(() => '')).toLowerCase();
          if (tagName === 'select') {
            // Select the first option that has a value
            const options = el.locator('option');
            const optCount = await options.count();
            for (let j = 0; j < optCount; j++) {
              const opt = options.nth(j);
              const optVal = await opt.getAttribute('value') || '';
              if (optVal) {
                await el.selectOption(optVal);
                break;
              }
            }
          } else {
            await el.fill(fillVal);
          }
        }
      }
    } catch (err) {
      console.warn(`[Runner] Failed to auto-fill input field:`, err);
    }
  }
}

async function captureLivePreview(page: Page | null, runId: string): Promise<void> {
  if (!page || page.isClosed()) return;
  try {
    const webScreenshotPath = await saveScreenshot(page, runId, 'live', true);
    if (webScreenshotPath) {
      await runStore.updateRun(runId, { latestScreenshotPath: webScreenshotPath });
    }
  } catch (err) {
    console.error(`[Runner] Live preview screenshot capture failed:`, err);
  }
}

interface VisionStepDecision {
  action: 'navigate' | 'click' | 'fill' | 'verify' | 'complete' | 'fail';
  target?: string;
  field?: string;
  value?: string;
  description: string;
  explanation: string;
}

const VISION_SYSTEM_PROMPT = `You are an autonomous visual QA test execution agent for ShipCheck.
Your job is to inspect a website screenshot, current URL, and visible elements layout summary, and decide the NEXT SINGLE LOGICAL ACTION to achieve the user's objective.

Supported actions:
1. "navigate": Open a URL path or full URL. Set "target" to the URL path or full URL.
2. "click": Click a button, link, or tab. Set "target" to the text or selector of the element.
3. "fill": Enter text into an input field. Set "field" to the field's label or placeholder, and "value" to the text to insert.
4. "verify": Verify that text or a success state is visible on screen. Set "target" to the text/message you are verifying.
5. "complete": Select this when the user's objective is fully accomplished (e.g. success message verified, dashboard loaded).
6. "fail": Select this if the page shows a clear validation error, authentication block, or if the task is blocked/impossible.

RULES:
- Perform ONLY ONE action per step.
- Do not repeat actions that already occurred and had no effect.
- Focus on visible, interactive elements on screen.
- Skip third-party/SSO provider buttons to avoid external redirects.
- Never enter real credentials, passwords, or credit card numbers. Use mock details.
- Provide a clear, short description of the action and an explanation of your visual reasoning based on the screenshot.

Your response must be valid raw JSON conforming to this schema:
{
  "action": "navigate" | "click" | "fill" | "verify" | "complete" | "fail",
  "target": "string (optional)",
  "field": "string (optional)",
  "value": "string (optional)",
  "description": "string",
  "explanation": "string"
}`;

async function extractPageLayoutSummary(page: Page): Promise<string> {
  try {
    return await page.evaluate(() => {
      const summary: string[] = [];
      summary.push(`Page Title: ${document.title}`);
      
      const inputs = Array.from(document.querySelectorAll('input:not([type="hidden"]), textarea, select'));
      const buttons = Array.from(document.querySelectorAll('button, input[type="submit"], input[type="button"], [role="button"]'));
      const links = Array.from(document.querySelectorAll('a'));

      const getElementLabel = (el: HTMLElement) => {
        let label = '';
        if (el.id) {
          const matchedLabel = document.querySelector(`label[for="${el.id}"]`);
          if (matchedLabel) label = matchedLabel.textContent || '';
        }
        if (!label) {
          label = el.getAttribute('placeholder') || el.getAttribute('name') || el.getAttribute('aria-label') || el.getAttribute('id') || '';
        }
        return label.trim();
      };

      summary.push('--- VISIBLE FORM FIELDS ---');
      inputs.forEach((input, index) => {
        const htmlInput = input as HTMLElement;
        const rect = htmlInput.getBoundingClientRect();
        const isVisible = rect.width > 0 && rect.height > 0 && window.getComputedStyle(htmlInput).display !== 'none';
        if (isVisible) {
          const type = htmlInput.getAttribute('type') || htmlInput.tagName.toLowerCase();
          const label = getElementLabel(htmlInput);
          const value = (htmlInput as HTMLInputElement).value || '';
          summary.push(`Field ${index + 1}: Label/Placeholder="${label}" | Type="${type}" | CurrentValue="${value}"`);
        }
      });

      summary.push('--- VISIBLE BUTTONS ---');
      buttons.forEach((btn, index) => {
        const htmlBtn = btn as HTMLElement;
        const rect = htmlBtn.getBoundingClientRect();
        const isVisible = rect.width > 0 && rect.height > 0 && window.getComputedStyle(htmlBtn).display !== 'none';
        if (isVisible) {
          const text = htmlBtn.innerText.trim() || htmlBtn.getAttribute('value') || htmlBtn.getAttribute('aria-label') || 'Button';
          summary.push(`Button ${index + 1}: Text="${text}"`);
        }
      });

      summary.push('--- VISIBLE LINKS ---');
      links.forEach((link, index) => {
        const htmlLink = link as HTMLElement;
        const rect = htmlLink.getBoundingClientRect();
        const isVisible = rect.width > 0 && rect.height > 0 && window.getComputedStyle(htmlLink).display !== 'none';
        if (isVisible && summary.length < 50) {
          const text = htmlLink.innerText.trim();
          const href = htmlLink.getAttribute('href') || '';
          if (text) {
            summary.push(`Link ${index + 1}: Text="${text}" | Href="${href}"`);
          }
        }
      });

      return summary.join('\n');
    });
  } catch (err) {
    return 'Failed to extract layout elements: ' + String(err);
  }
}

async function getVisionStepDecision(
  page: Page,
  task: string,
  expectedResult?: string,
  executedStepsLog?: string
): Promise<VisionStepDecision> {
  const currentUrl = page.url();
  const layoutSummary = await extractPageLayoutSummary(page);
  const errors = await getVisiblePageErrors(page);
  
  const screenshotBuffer = await page.screenshot({ type: 'jpeg', quality: 75 });
  const base64Image = screenshotBuffer.toString('base64');

  const userPrompt = `Target Task: "${task}"
Expected Success Indicator: "${expectedResult || 'None specified'}"
Current Browser URL: ${currentUrl}

EXPLICIT VISIBLE ELEMENTS LAYOUT:
${layoutSummary}

OBSERVED PAGE ERRORS OR VALIDATION WARNINGS (IF ANY):
${errors.length > 0 ? errors.map(e => `- ${e}`).join('\n') : 'None detected.'}

ALREADY EXECUTED STEPS HISTORY:
${executedStepsLog || 'No steps executed yet.'}`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: VISION_SYSTEM_PROMPT },
      {
        role: 'user',
        content: [
          { type: 'text', text: userPrompt },
          {
            type: 'image_url',
            image_url: {
              url: `data:image/jpeg;base64,${base64Image}`,
            },
          },
        ],
      },
    ],
    response_format: { type: 'json_object' },
  });

  const content = completion.choices[0].message.content;
  if (!content) throw new Error('Empty response from OpenAI Vision Agent.');

  return JSON.parse(content) as VisionStepDecision;
}

export async function runBrowserTest(runId: string, startUrl: string, plan: TestPlan): Promise<void> {
  const screenshotsDir = path.join(process.cwd(), 'public', 'screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  // Create initial run progress structure
  const totalSteps = plan.steps.length;

  if (totalSteps === 0) {
    await runStore.updateRun(runId, {
      status: 'error',
      errorMessage: 'No executable test steps were generated. Direct sign-in or portal authentication actions are restricted for safety.',
      progress: 100,
      finishedAt: new Date().toISOString(),
    });
    return;
  }

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
    console.log(`[Runner] Launching local Chromium...`);
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

    // Check if it's a dynamic vision execution or static deterministic run
    const isDynamicVision = plan.steps.length === 1 && plan.steps[0].action === 'navigate';

    if (isDynamicVision) {
      console.log(`[Runner] Starting Dynamic Vision Agent Loop for run ${runId}`);
      
      // Step 1: Navigate to the start URL (initial placeholder step)
      const initialStep = plan.steps[0];
      await runStore.addStepResult(runId, {
        stepId: initialStep.id,
        status: 'running',
      });
      await runStore.updateRun(runId, { progress: 10 });
      
      try {
        await page.goto(startUrl, { waitUntil: 'load', timeout: 15000 });
        const webScreenshotPath = await saveScreenshot(page, runId, initialStep.id);
        
        await runStore.addStepResult(runId, {
          stepId: initialStep.id,
          status: 'passed',
          screenshotPath: webScreenshotPath,
          url: page.url(),
        });
        await runStore.addEvidence(runId, {
          id: `evidence-${initialStep.id}-passed`,
          stepId: initialStep.id,
          type: 'screenshot',
          value: webScreenshotPath,
          timestamp: new Date().toISOString(),
        });
        await captureLivePreview(page, runId);
      } catch (err: any) {
        runFailed = true;
        const webScreenshotPath = await saveScreenshot(page, runId, `${initialStep.id}-fail`).catch(() => '');
        await runStore.addStepResult(runId, {
          stepId: initialStep.id,
          status: 'failed',
          error: `Initial navigation failed: ${err.message || err}`,
          screenshotPath: webScreenshotPath || undefined,
          url: page.url(),
        });
      }

      // Live step log accumulator for context window matching
      const executedStepsLog: string[] = [
        `- Step 1: "Navigate to starting page" | Status: passed | URL: ${page.url()}`
      ];

      const maxSteps = 10;
      stepIndex = 1;

      while (stepIndex < maxSteps && !runFailed) {
        // Enforce breath time before evaluation
        await page.waitForTimeout(1000);

        console.log(`[Runner] Visual evaluation loop step ${stepIndex + 1}...`);
        
        // 1. Get the next dynamic step decision from GPT-4o-mini
        let decision: VisionStepDecision;
        try {
          decision = await getVisionStepDecision(
            page,
            plan.goal,
            plan.goal,
            executedStepsLog.join('\n')
          );
        } catch (err: any) {
          console.error(`[Runner] Vision evaluation call failed:`, err);
          runFailed = true;
          break;
        }

        console.log(`[Runner] Decided next step: action="${decision.action}" | explanation="${decision.explanation}"`);

        // Check if the AI declared the task complete or failed
        if (decision.action === 'complete') {
          console.log('[Runner] Vision Agent declared the task complete!');
          break;
        }
        if (decision.action === 'fail') {
          console.error('[Runner] Vision Agent declared the task failed:', decision.explanation);
          runFailed = true;
          
          const failStepId = `step-${stepIndex + 1}`;
          const currentPlan = await runStore.getRun(runId).then(r => r?.plan);
          if (currentPlan) {
            currentPlan.steps.push({
              id: failStepId,
              action: 'verify',
              target: 'Goal check',
              description: decision.description || 'Vision Agent failed to complete the task.'
            });
            await runStore.updateRun(runId, { plan: currentPlan });
          }
          await runStore.addStepResult(runId, {
            stepId: failStepId,
            status: 'failed',
            error: decision.explanation || 'Vision Agent failed to satisfy success condition.',
            url: page.url()
          });
          break;
        }

        // Generate the step properties dynamically
        const nextStepId = `step-${stepIndex + 1}`;
        const nextStep: TestStep = {
          id: nextStepId,
          action: decision.action,
          target: decision.target,
          field: decision.field,
          value: decision.value,
          description: decision.description || `${decision.action} action evaluated by vision`,
        };

        // Append the new step dynamically to the run's plan in DB
        const currentPlan = await runStore.getRun(runId).then(r => r?.plan);
        if (currentPlan) {
          currentPlan.steps.push(nextStep);
          await runStore.updateRun(runId, { plan: currentPlan });
        }

        // Add the step result as running
        await runStore.addStepResult(runId, {
          stepId: nextStepId,
          status: 'running',
        });
        await captureLivePreview(page, runId);
        
        const currentProgress = Math.round(10 + (stepIndex / maxSteps) * 85);
        await runStore.updateRun(runId, { progress: currentProgress });

        const startTime = Date.now();

        try {
          // 2. Execute the action
          switch (nextStep.action) {
            case 'navigate': {
              let targetUrl = nextStep.target || '';
              if (targetUrl.startsWith('/')) {
                const base = new URL(page.url());
                targetUrl = `${base.protocol}//${base.host}${targetUrl}`;
              } else if (!/^https?:\/\//i.test(targetUrl)) {
                targetUrl = `https://${targetUrl}`;
              }
              await page.goto(targetUrl, { waitUntil: 'load', timeout: 15000 });
              break;
            }

            case 'fill': {
              const fieldVal = nextStep.field || '';
              const fieldLower = fieldVal.toLowerCase();
              if (!fieldVal || fieldLower.includes('required') || fieldLower.includes('field') || fieldLower.includes('form') || fieldLower.includes('all')) {
                await fillAllVisibleFields(page, nextStep.value || 'Sample Text');
              } else {
                const fieldLocator = await findInputElement(page, fieldVal);
                await fieldLocator.focus({ timeout: 15000 });
                await fieldLocator.fill(nextStep.value || '', { timeout: 15000 });
              }
              break;
            }

            case 'click': {
              const clickLocator = await findClickableElement(page, nextStep.target || '');
              await clickLocator.click({ timeout: 15000 });
              await page.waitForTimeout(400);
              break;
            }

            case 'verify': {
              const textToFind = nextStep.target || '';
              let found = false;
              try {
                await page.waitForFunction((txt) => {
                  return document.body.innerText.includes(txt);
                }, textToFind, { timeout: 15000 });
                found = true;
              } catch {
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
              break;
            }
          }

          // 3. Save passed details
          const duration = Date.now() - startTime;
          const webScreenshotPath = await saveScreenshot(page, runId, nextStepId);

          await runStore.addStepResult(runId, {
            stepId: nextStepId,
            status: 'passed',
            durationMs: duration,
            screenshotPath: webScreenshotPath,
            url: page.url(),
          });
          await runStore.addEvidence(runId, {
            id: `evidence-${nextStepId}-passed`,
            stepId: nextStepId,
            type: 'screenshot',
            value: webScreenshotPath,
            timestamp: new Date().toISOString(),
          });

          // Log success in history log
          executedStepsLog.push(
            `- Step ${stepIndex + 1}: "${nextStep.description}" | Status: passed | URL: ${page.url()}`
          );

          await captureLivePreview(page, runId);

        } catch (stepError: any) {
          console.error(`[Runner] Dynamic Step ${nextStepId} failed:`, stepError.message);
          runFailed = true;

          const duration = Date.now() - startTime;
          let webScreenshotPath = '';
          try {
            webScreenshotPath = await saveScreenshot(page, runId, `${nextStepId}-fail`);
          } catch {}

          let pageText = '';
          try {
            pageText = await page.evaluate(() => document.body.innerText.slice(0, 2000));
          } catch {}

          await runStore.addStepResult(runId, {
            stepId: nextStepId,
            status: 'failed',
            durationMs: duration,
            error: stepError.message || String(stepError),
            screenshotPath: webScreenshotPath || undefined,
            url: page.url(),
          });

          if (webScreenshotPath) {
            await runStore.addEvidence(runId, {
              id: `evidence-${nextStepId}-fail-screenshot`,
              stepId: nextStepId,
              type: 'screenshot',
              value: webScreenshotPath,
              timestamp: new Date().toISOString(),
            });
          }
          if (pageText) {
            await runStore.addEvidence(runId, {
              id: `evidence-${nextStepId}-fail-text`,
              stepId: nextStepId,
              type: 'text',
              value: pageText,
              timestamp: new Date().toISOString(),
            });
          }
        }

        stepIndex++;
      }
    } else {
      // Execute the existing static step-by-step runner logic
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
              const fieldVal = step.field || '';
              const fieldLower = fieldVal.toLowerCase();
              
              // If the planner generated a generic form-filling step, or the field is generic/empty,
              // we dynamically auto-fill all visible fields on the form with smart values!
              if (!fieldVal || fieldLower.includes('required') || fieldLower.includes('field') || fieldLower.includes('form') || fieldLower.includes('all')) {
                await fillAllVisibleFields(page, step.value || 'Sample Text');
              } else {
                const fieldLocator = await findInputElement(page, fieldVal);
                await fieldLocator.focus({ timeout: 15000 });
                await captureLivePreview(page, runId);
                await fieldLocator.fill(step.value || '', { timeout: 15000 });
              }
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
          const webScreenshotPath = await saveScreenshot(page, runId, step.id);

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
            webScreenshotPath = await saveScreenshot(page, runId, `${step.id}-fail`);
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
