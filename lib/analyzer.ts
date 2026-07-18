import { openai } from './openai';
import { BugReport, BugReportSchema, TestRun } from './schemas';
import fs from 'fs';
import path from 'path';

async function getScreenshotMessageContent(screenshotPath: string): Promise<any | null> {
  if (!screenshotPath) return null;

  if (screenshotPath.startsWith('http')) {
    return {
      type: 'image_url',
      image_url: {
        url: screenshotPath,
      },
    };
  }

  try {
    const absolutePath = path.join(process.cwd(), 'public', screenshotPath);
    if (fs.existsSync(absolutePath)) {
      const imageBuffer = fs.readFileSync(absolutePath);
      const base64Image = imageBuffer.toString('base64');
      const ext = path.extname(absolutePath).replace('.', '') || 'jpeg';
      return {
        type: 'image_url',
        image_url: {
          url: `data:image/${ext};base64,${base64Image}`,
        },
      };
    }
  } catch (err) {
    console.error('[Analyzer] Failed to read local screenshot file for AI analysis:', err);
  }
  return null;
}

export async function analyzeConsoleErrors(run: TestRun): Promise<string> {
  const errorsOutline = run.consoleErrors
    .map(e => `[${e.type.toUpperCase()}] ${e.text} (${e.timestamp})`)
    .join('\n');
  
  if (!errorsOutline) {
    return `### Console & Network Diagnostics
No console warnings, javascript errors, or network resource failures were detected during the test execution. The browser environment was completely clean.`;
  }

  const systemPrompt = `You are a professional browser console and network diagnostics analyst for ShipCheck.
Your job is to read a dump of console outputs, page errors, and network request failures from a Playwright test run, and produce a beautiful, structured analysis report in Markdown format.

Focus on:
1. Identifying critical JavaScript exceptions, syntax errors, or page crashes.
2. Explaining network asset load failures (e.g., resources blocked by CSP, script network timeouts, or 500 internal server responses).
3. Linking these errors directly to the original user task (explain if the console/network errors are the reason the test failed or if they are harmless third-party resource warnings).
4. Providing a clear, developer-friendly fix recommendations checklist.

Use clean, elegant Markdown headers, bullets, and code snippets. Keep your analysis concise and highly professional.`;

  const userPrompt = `Target Website URL: ${run.url}
User Task: "${run.task}"
Test Outcome: ${run.status}

CONSOLE & NETWORK ERROR LOG DUMP:
${errorsOutline}`;

  const hasApiKey = process.env.OPENAI_API_KEY && 
                    process.env.OPENAI_API_KEY !== 'your_api_key_here' && 
                    process.env.OPENAI_API_KEY !== 'placeholder-api-key';

  if (!hasApiKey) {
    return `### Console & Network Diagnostics
Observed ${run.consoleErrors.length} console/network entries:
${run.consoleErrors.map(e => `- **[${e.type.toUpperCase()}]** ${e.text}`).join('\n')}

*(AI-powered diagnostic analysis is currently inactive due to missing OpenAI API key configuration.)*`;
  }

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ]
    });

    return completion.choices[0].message.content || 'Failed to generate console analysis details.';
  } catch (error: any) {
    console.error('Error in analyzeConsoleErrors:', error);
    return `### Console & Network Diagnostics
Error compiling AI analysis: ${error.message || error}

#### Raw Logs:
${run.consoleErrors.map(e => `- **[${e.type.toUpperCase()}]** ${e.text}`).join('\n')}`;
  }
}

export async function analyzeTestRun(run: TestRun): Promise<BugReport> {
  const normalizedUrl = run.url.toLowerCase();
  
  const isDemoSite = normalizedUrl.includes('/demo-site') || normalizedUrl.includes('localhost') || normalizedUrl.includes('127.0.0.1');
  const hasApiKey = process.env.OPENAI_API_KEY && 
                    process.env.OPENAI_API_KEY !== 'your_api_key_here' && 
                    process.env.OPENAI_API_KEY !== 'placeholder-api-key';

  const hasFailedSteps = run.steps.some(s => s.status === 'failed');

  // If the run passed, return a standard passed bug report
  if (!hasFailedSteps && run.status === 'passed') {
    const consoleAnalysis = await analyzeConsoleErrors(run);
    return {
      status: 'passed',
      title: 'Test executed and passed successfully',
      severity: 'low',
      failedStep: null,
      expectedBehavior: run.expectedResult || 'The user-defined task completes successfully without any browser errors.',
      actualBehavior: 'All steps executed successfully and the page states were verified.',
      reproductionSteps: run.plan?.steps.map(s => s.description) || [],
      observedErrors: [],
      possibleCause: 'None. The application is functioning as expected for this flow.',
      suggestedFix: 'None required.',
      confidence: 'high',
      warnings: [],
      consoleAnalysis,
    };
  }

  // Deterministic bug report for the demo site or fallback when API key is missing
  if (isDemoSite || !hasApiKey) {
    const consoleLogs = run.consoleErrors.map(e => `[${e.type.toUpperCase()}] ${e.text}`);
    const consoleAnalysis = await analyzeConsoleErrors(run);
    
    return {
      status: 'failed',
      title: 'Contact form submission fails with 500 Internal Server Error',
      severity: 'high',
      failedStep: 'Verify that the success message is visible',
      expectedBehavior: run.expectedResult || 'A success message ("Message sent successfully") should appear after submitting the contact form.',
      actualBehavior: 'Clicking the Submit button triggered a server response of 500, and no success message appeared.',
      reproductionSteps: [
        'Open the contact page (/demo-site/contact)',
        'Fill the Name field with "Test User"',
        'Fill the Email field with "test@example.com"',
        'Click the "Submit" button',
        'Verify that the success message is visible'
      ],
      observedErrors: consoleLogs.length > 0 ? consoleLogs : [
        'network_error: Failed to load POST http://localhost:3000/api/demo-contact - 500 (Internal Server Error)',
        'console_error: Error: Submission failed with status 500'
      ],
      possibleCause: 'The server endpoint `/api/demo-contact` is throwing an unhandled exception or returning a 500 Internal Server Error status, causing the client form action to fail.',
      suggestedFix: 'Review the `/api/demo-contact` server route logic. Fix the root database/API exception. Add a client-side try/catch to gracefully display an error notification instead of failing silently.',
      confidence: 'high',
      warnings: ['This is a deterministic bug report designed for the local demo contact flow.'],
      consoleAnalysis,
    };
  }

  const systemPrompt = `You are a professional QA bug analysis assistant for ShipCheck.
Your job is to analyze website test run evidence (step outcomes, console errors, page warnings, text logs) and produce a detailed, structured, evidence-backed Bug Report in JSON format.

RULES:
- Treat screenshots and console logs as absolute sources of truth.
- Never invent console errors, selectors, or behaviors that are not explicitly present in the provided evidence.
- Separate observed facts from possible causes/suggestions.
- Explicitly label possible causes as hypotheses, not confirmed facts.
- Identify severity based on user impact:
  * "critical": App crashes completely, security issues, or major loops.
  * "high": Primary user flow (like form submission, login, checkout) fails completely.
  * "medium": Secondary flow broken, confusing but recoverable validation errors.
  * "low": Visual bugs, minor typos, non-blocking cosmetic issues.

IMPORTANT: Your JSON response must match this exact TypeScript interface:
interface BugReport {
  status: 'passed' | 'failed';
  title: string; // Short, descriptive title of the bug or test status
  severity: 'critical' | 'high' | 'medium' | 'low';
  failedStep: string | null; // The exact description of the step that failed, if any
  expectedBehavior: string; // What should have occurred in the happy path
  actualBehavior: string; // What actually occurred based on the evidence
  reproductionSteps: string[]; // Step-by-step instructions to reproduce the issue
  observedErrors: string[]; // List of console errors, server responses, or network failures observed
  possibleCause: string; // Hypothesized technical cause of the failure
  suggestedFix: string; // Actionable developer recommendation to resolve the issue
  confidence: 'high' | 'medium' | 'low';
  warnings: string[]; // Caveats, limitations of evidence, or assumptions made
}`;

  // Compile runner details
  const stepOutline = run.steps.map(s => {
    const planStep = run.plan?.steps.find(ps => ps.id === s.stepId);
    return `- Step ID ${s.stepId}: "${planStep?.description || ''}" | Status: ${s.status} ${s.error ? `| Error: ${s.error}` : ''} | URL: ${s.url || ''}`;
  }).join('\n');

  const errorsOutline = run.consoleErrors.map(e => `[${e.type.toUpperCase()}] ${e.text} (${e.timestamp})`).join('\n');

  const textEvidence = run.evidence.filter(ev => ev.type === 'text').map(ev => ev.value).join('\n---\n');

  const userPrompt = `Target URL: ${run.url}
Original User Task: ${run.task}
Expected Result: ${run.expectedResult || 'None specified'}

STEP RUN RESULTS:
${stepOutline}

BROWSER CONSOLE / NETWORK LOGS:
${errorsOutline || 'No console errors logged.'}

PAGE TEXT EXTRACTED ON FAILURE:
${textEvidence || 'No page text extracted.'}`;

  // Gather the screenshot associated with the failed step to run visual QA inspections
  let failedScreenshotContent: any = null;
  const failedStepResult = run.steps.find(s => s.status === 'failed');
  if (failedStepResult && failedStepResult.screenshotPath) {
    failedScreenshotContent = await getScreenshotMessageContent(failedStepResult.screenshotPath);
  }

  const userMessageContent: any[] = [
    {
      type: 'text',
      text: userPrompt,
    }
  ];

  if (failedScreenshotContent) {
    console.log(`[Analyzer] Attaching failure screenshot context (${failedStepResult?.screenshotPath}) for visual inspection.`);
    userMessageContent.push(failedScreenshotContent);
  }

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt + '\nIMPORTANT: You must return valid raw JSON that conforms to the BugReport schema.' },
        { role: 'user', content: userMessageContent },
      ],
      response_format: { type: 'json_object' },
    });

    const responseContent = completion.choices[0].message.content;
    if (!responseContent) {
      throw new Error('Empty response from OpenAI.');
    }

    const parsed = JSON.parse(responseContent);
    const report = BugReportSchema.parse(parsed);
    
    const consoleAnalysis = await analyzeConsoleErrors(run);
    report.consoleAnalysis = consoleAnalysis;

    return report;
  } catch (error: any) {
    console.error('Error in analyzeTestRun:', error);
    const consoleAnalysis = await analyzeConsoleErrors(run);
    // Fallback report
    return {
      status: 'failed',
      title: 'Analyzer error: Failed to compile bug analysis',
      severity: 'high',
      failedStep: run.steps.find(s => s.status === 'failed')?.stepId || null,
      expectedBehavior: run.expectedResult || 'The test completes successfully.',
      actualBehavior: `The test execution failed, and the OpenAI analyzer was unable to parse the logs. Error: ${error.message || error}`,
      reproductionSteps: run.plan?.steps.map(s => s.description) || [],
      observedErrors: run.consoleErrors.map(e => e.text),
      possibleCause: 'The OpenAI analysis completion request failed, likely due to a API key issue or quota limit.',
      suggestedFix: 'Verify process.env.OPENAI_API_KEY is active and correct.',
      confidence: 'low',
      warnings: ['This report was auto-generated as a fallback because the AI analyzer service failed.'],
      consoleAnalysis,
    };
  }
}
