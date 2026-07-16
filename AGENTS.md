# ShipCheck Project Instructions

## Product goal

ShipCheck is an AI-powered website testing assistant. A user enters a public website URL, a natural-language task, and an optional expected result. ShipCheck converts the task into structured browser steps, runs those steps with Playwright, captures evidence, and generates an evidence-backed bug report.

The hackathon MVP must prioritize one reliable end-to-end flow over broad feature coverage.

## MVP scope

Support these browser actions only:

- navigate
- click
- fill
- verify visible text

The primary demo flow is:

1. Open a public demo website.
2. Navigate to its contact page.
3. Fill a name and email.
4. Submit the form.
5. Verify a success message.
6. Capture a screenshot and console errors if the test fails.
7. Generate a bug report with severity, expected behavior, actual behavior, reproduction steps, and a suggested fix.

## Architecture

Use a Next.js and TypeScript application with these logical layers:

- UI: test setup, live progress, evidence, and report screens.
- Planner: OpenAI converts the user's task into validated structured JSON steps.
- Runner: Playwright executes only the supported actions.
- Evidence collector: screenshots, console errors, URL, step status, and visible page text.
- Analyzer: OpenAI converts test evidence into a structured bug report.

Keep the OpenAI API key server-side. Never expose it in client-side code or commit it to the repository.

## AI behavior

- Use structured JSON output and validate it with Zod.
- Never invent a selector, error, screenshot finding, or root cause.
- If an element cannot be found, report that clearly.
- Separate observed facts from possible causes and suggestions.
- Treat AI-generated root causes as hypotheses, not confirmed facts.
- Keep the original user task and expected result in every analysis request.

## Browser safety

- Run tests only against public demo sites or sites explicitly authorized by the user.
- Do not collect passwords, payment details, personal data, or authentication tokens.
- Do not submit real purchases, applications, messages, or destructive actions.
- Add timeouts and a maximum step count to every test.
- Do not allow arbitrary code execution from an AI response.
- Allowlist supported actions and reject every unsupported action.

## UX requirements

The main product flow must be visible without a chat interface:

1. Enter URL and task.
2. Run test.
3. See live step progress.
4. Inspect screenshot/evidence.
5. Read the generated bug report.

Use clear status colors: green for passed, red for failed, amber for warnings, and blue for active steps. Include useful loading, timeout, invalid URL, and no-evidence states.

## Demo strategy

Maintain a small demo target website with intentional bugs. The primary demo should be deterministic and should not depend on an unrelated public website. Include at least one broken contact-form flow and one console error.

## Development rules

- Prefer small, readable components and functions.
- Keep browser execution on the server.
- Use environment variables for secrets and configuration.
- Do not add authentication, GitHub integration, automatic code changes, payments, or scheduled monitoring until the core flow is complete.
- Do not claim a test passed unless the expected result was actually observed.
- Preserve useful error details in the result shown to the user.

## Verification before submission

Test at least these cases:

- A fully passing contact-form flow.
- A missing success message.
- An element that cannot be found.
- A console error.
- An invalid URL.
- A browser timeout.

Before submission, verify that the hosted URL is public, the repository contains setup instructions, the demo does not require secret credentials, and the three-minute video shows the complete flow.

## Suggested commands

Use the package manager already selected by the repository. Expected commands are:

```bash
npm run dev
npm run lint
npm run build
```

If a command is missing, add the smallest appropriate script rather than introducing unnecessary tooling.
