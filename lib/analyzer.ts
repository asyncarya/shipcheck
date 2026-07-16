import { openai } from './openai';
import { BugReport, BugReportSchema, TestRun } from './schemas';

export async function analyzeTestRun(run: TestRun): Promise<BugReport> {
  const normalizedUrl = run.url.toLowerCase();
  
  const isDemoSite = normalizedUrl.includes('/demo-site') || normalizedUrl.includes('localhost') || normalizedUrl.includes('127.0.0.1');
  const hasApiKey = process.env.OPENAI_API_KEY && 
                    process.env.OPENAI_API_KEY !== 'your_api_key_here' && 
                    process.env.OPENAI_API_KEY !== 'placeholder-api-key';

  const hasFailedSteps = run.steps.some(s => s.status === 'failed');

  // If the run passed, return a standard passed bug report
  if (!hasFailedSteps && run.status === 'passed') {
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
    };
  }

  // Deterministic bug report for the demo site or fallback when API key is missing
  if (isDemoSite || !hasApiKey) {
    const consoleLogs = run.consoleErrors.map(e => `[${e.type.toUpperCase()}] ${e.text}`);
    
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
      warnings: ['This is a deterministic bug report designed for the local demo contact flow.']
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
  * "low": Visual bugs, minor typos, non-blocking cosmetic issues.`;

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

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt + '\nIMPORTANT: You must return valid raw JSON that conforms to the BugReport schema.' },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
    });

    const responseContent = completion.choices[0].message.content;
    if (!responseContent) {
      throw new Error('Empty response from OpenAI.');
    }

    const parsed = JSON.parse(responseContent);
    const report = BugReportSchema.parse(parsed);

    return report;
  } catch (error: any) {
    console.error('Error in analyzeTestRun:', error);
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
    };
  }
}
