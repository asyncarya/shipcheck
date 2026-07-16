# ShipCheck

> Turn plain-English product requirements into browser tests and evidence-backed bug reports.

ShipCheck is an AI-powered website testing assistant for developers, designers, and product teams. A user provides a public website URL and describes a task in natural language. ShipCheck converts the task into structured browser actions, executes the actions with Playwright, collects evidence, and generates a clear bug report when something goes wrong.

## Product summary

### The problem

Website testing often requires writing repetitive test scripts or manually clicking through the product. Small teams may not have dedicated QA engineers, so broken flows, unclear errors, and poor user experiences reach production.

### The solution

ShipCheck lets a user write:

```text
Open the contact page, submit the form, and verify that a success message appears.
```

ShipCheck then:

1. Converts the request into a structured test plan.
2. Opens the website in a controlled browser.
3. Performs the supported actions.
4. Verifies the expected result.
5. Captures screenshots, console errors, URLs, and step results.
6. Generates a prioritized bug report with reproduction steps and a suggested fix.

## Hackathon MVP

The MVP should deliver one reliable end-to-end workflow rather than many incomplete features.

### Supported input

- A public website URL.
- A natural-language test task.
- An optional expected result.

### Supported browser actions

- Navigate to a page.
- Click a button, link, or visible control.
- Fill a text field.
- Verify that text or a visible UI state exists.

### Primary demo flow

1. User enters the demo website URL.
2. User enters: `Submit the contact form and verify the success message.`
3. ShipCheck generates a test plan.
4. Playwright opens the website and fills the form.
5. The test reaches a deliberately broken submit action.
6. ShipCheck captures the failed state and console error.
7. ShipCheck generates a bug report showing severity, expected behavior, actual behavior, and a suggested fix.

## Feature specification

### 1. Test setup

The setup screen is the entry point for every test.

#### Fields

**Website URL**

- Required.
- Must be a valid HTTP or HTTPS URL.
- Do not allow local file paths or unsupported protocols.

**Task description**

- Required.
- Written in natural language.
- Example: `Add a product to the cart and verify that the cart count changes to 1.`

**Expected result**

- Optional but strongly recommended.
- Example: `A green “Message sent successfully” notification should appear.`

#### Validation

- Show an error for an empty URL.
- Show an error for an invalid URL.
- Show an error for an empty task.
- Display a warning when the URL is not HTTPS.
- Do not start a run until required fields are valid.

### 2. AI test planning

The planner converts the user request into a small, validated list of actions.

#### Planner responsibilities

- Identify the intended pages and controls.
- Select only supported actions.
- Add verification steps based on the expected result.
- Use human-readable selector hints rather than depending on brittle selectors.
- Explain when the task is ambiguous or unsupported.

#### Planner output

```json
{
  "goal": "Submit the contact form and verify the success message",
  "steps": [
    {
      "id": "step-1",
      "action": "navigate",
      "target": "/contact",
      "description": "Open the contact page"
    },
    {
      "id": "step-2",
      "action": "fill",
      "field": "name",
      "value": "Test User",
      "description": "Fill in the name field"
    },
    {
      "id": "step-3",
      "action": "fill",
      "field": "email",
      "value": "test@example.com",
      "description": "Fill in the email field"
    },
    {
      "id": "step-4",
      "action": "click",
      "target": "Submit",
      "description": "Submit the contact form"
    },
    {
      "id": "step-5",
      "action": "verify",
      "target": "success message",
      "description": "Verify that the success message is visible"
    }
  ]
}
```

The application must validate the output before sending it to Playwright. Any unsupported action must be rejected.

### 3. Browser test runner

The runner executes the plan on the server using Playwright.

#### Runner responsibilities

- Launch a controlled browser.
- Visit the supplied URL.
- Locate fields and controls using safe strategies.
- Execute one step at a time.
- Record the status and duration of each step.
- Capture screenshots after important steps and failures.
- Capture browser console errors.
- Record the current URL.
- Stop safely on timeout or unsupported behavior.

#### Step states

- `pending`
- `running`
- `passed`
- `failed`
- `skipped`

#### Runner limits

- Maximum 10 steps per test.
- Maximum 60 seconds per test.
- Maximum 15 seconds per individual action.
- No arbitrary JavaScript execution from AI output.
- No credentials, payment details, or destructive actions.

### 4. Live test progress

While a test is running, the interface should show:

- Test name.
- Overall progress.
- Current action.
- Completed steps.
- Active step.
- Browser screenshot or latest evidence.
- Console-error count.
- Cancel button if cancellation is supported.

Example progress display:

```text
✓ Opened contact page
✓ Filled name field
✓ Filled email field
⟳ Clicking Submit
○ Verifying success message
```

### 5. Evidence collection

Every test result should retain enough evidence for a person to understand what happened.

#### Evidence types

- Screenshot before failure.
- Screenshot after failure when possible.
- Current URL.
- Failed step.
- Visible page text near the failed area.
- Browser console errors.
- Network error summary when available.
- Timestamp.

Evidence must be labeled as observed data. The AI must not claim that a screenshot proves something it cannot clearly see.

### 6. AI bug analysis

The analyzer receives the original task and collected evidence. It returns a structured report.

#### Bug report output

```json
{
  "status": "failed",
  "title": "Contact form does not display a success message",
  "severity": "high",
  "failed_step": "Verify that the success message is visible",
  "expected_behavior": "A success message should appear after submitting the form.",
  "actual_behavior": "The form remained on the same page and no success message was visible.",
  "reproduction_steps": [
    "Open the contact page",
    "Enter Test User in the name field",
    "Enter test@example.com in the email field",
    "Click Submit"
  ],
  "observed_errors": [
    "POST /api/contact returned status 500"
  ],
  "possible_cause": "The form submission handler may be failing while processing the request.",
  "suggested_fix": "Handle the failed response and render an explicit success or error state in the form.",
  "confidence": "medium",
  "warnings": [
    "The possible cause is a hypothesis and should be confirmed in the source code."
  ]
}
```

#### Severity rules

**Critical**

- The main product cannot load.
- A destructive or security-sensitive action occurs unexpectedly.

**High**

- A primary user flow cannot be completed.
- Form submission or checkout fails.
- A major error prevents the expected result.

**Medium**

- A secondary flow is broken.
- An error is recoverable but confusing.
- A required validation message is missing.

**Low**

- Minor layout issue.
- Cosmetic inconsistency.
- Non-blocking copy or spacing issue.

The AI should select severity based on user impact, not merely on the presence of a console error.

### 7. Results dashboard

The result page should contain:

#### Summary header

- Passed or failed status.
- Test task.
- Website URL.
- Runtime.
- Number of passed and failed steps.

#### Step timeline

- Step number.
- Action description.
- Status.
- Duration.
- Screenshot link.

#### Evidence panel

- Screenshot viewer.
- Console errors.
- Current URL.
- Visible text or extracted error.

#### Bug report panel

- Title.
- Severity badge.
- Expected behavior.
- Actual behavior.
- Reproduction steps.
- Possible cause.
- Suggested fix.
- Confidence and warnings.

#### Actions

- Copy bug report.
- Download JSON.
- Run test again.

## Non-goals for the hackathon MVP

Do not implement these before the basic flow is reliable:

- Automatic code changes.
- GitHub pull requests.
- Password or authentication testing.
- Payment testing.
- Real customer data.
- Scheduled monitoring.
- Multi-browser comparison.
- Full accessibility certification.
- Complete API testing platform.
- Support for arbitrary browser actions.

These can be listed as future roadmap items.

## Technical architecture

```text
Browser UI
  ├── Test Setup Form
  ├── Progress Timeline
  └── Results Dashboard
          │
          ▼
Next.js Server Routes
  ├── POST /api/plan
  ├── POST /api/run
  └── POST /api/analyze
          │
          ├── OpenAI planner
          ├── Playwright runner
          ├── Evidence collector
          └── OpenAI analyzer
```

### Suggested project structure

```text
app/
  page.tsx
  test/new/page.tsx
  test/[id]/page.tsx
  api/plan/route.ts
  api/run/route.ts
  api/analyze/route.ts

components/
  TestSetupForm.tsx
  TestProgress.tsx
  StepTimeline.tsx
  ScreenshotViewer.tsx
  ConsoleErrors.tsx
  BugReport.tsx
  SeverityBadge.tsx

lib/
  openai.ts
  planner.ts
  runner.ts
  analyzer.ts
  evidence.ts
  schemas.ts
  urlValidation.ts

demo-site/
  app/
  public/

public/
  screenshots/
```

## API contracts

### Create a test plan

`POST /api/plan`

Request:

```json
{
  "url": "https://example.com",
  "task": "Submit the contact form",
  "expectedResult": "A success message should appear"
}
```

Response:

```json
{
  "planId": "plan_123",
  "goal": "Submit the contact form",
  "steps": []
}
```

### Run a test

`POST /api/run`

Request:

```json
{
  "url": "https://example.com",
  "plan": {
    "steps": []
  }
}
```

Response:

```json
{
  "runId": "run_123",
  "status": "failed",
  "steps": [],
  "evidence": [],
  "consoleErrors": []
}
```

### Analyze a run

`POST /api/analyze`

Request:

```json
{
  "task": "Submit the contact form",
  "expectedResult": "A success message should appear",
  "runResult": {}
}
```

Response:

```json
{
  "bugReport": {}
}
```

## AI prompting rules

### Planner prompt requirements

The planner must:

- Return valid JSON only.
- Use only the supported actions.
- Keep plans under 10 steps.
- Prefer visible labels and text.
- Never request passwords, payment information, or destructive actions.
- Mark the plan unsupported if the request cannot be safely executed.

### Analyzer prompt requirements

The analyzer must:

- Use the run evidence as the primary source of truth.
- Distinguish observed facts from hypotheses.
- Never invent console errors.
- Never claim a test passed without observed verification.
- Return a confidence value.
- Include warnings when evidence is incomplete.

## Environment variables

Create `.env.local` locally:

```env
OPENAI_API_KEY=your_api_key_here
```

Never commit `.env.local`. Add it to `.gitignore`.

If storing results remotely later, add only the required database variables after the core MVP works.

## Safety and privacy

ShipCheck should run only against public demo websites or websites for which the user has authorization.

The application must not:

- Request or store passwords.
- Request or store payment details.
- Submit real orders or applications.
- Send real messages or emails.
- Execute arbitrary code returned by the model.
- Test private websites without explicit authorization.

Display this notice near the Run Test button:

> Run tests only on websites you own or are authorized to test. Do not use real credentials or sensitive data.

## Demo target website

Build a small target website specifically for the presentation. It should include:

- Home page.
- Contact page.
- Working form fields.
- Broken submit response.
- Console error after submission.
- A visible but incorrect success state in one scenario.

This makes the demo repeatable and avoids depending on an external website during judging.

## Testing checklist

### Functional tests

- Valid URL and task produce a plan.
- Invalid URL shows a helpful error.
- Empty task cannot be submitted.
- A passing flow is reported as passed.
- A missing element is reported as failed.
- A missing expected message is reported as failed.
- A console error is captured.
- A browser timeout ends safely.
- An unsupported action is rejected.

### UI tests

- Loading state is visible.
- Test progress updates clearly.
- Failed steps are easy to find.
- Screenshots are readable.
- Severity is visually clear.
- The report works on mobile and desktop.
- The user can run the test again.

### Security tests

- API key is never sent to the browser.
- `.env.local` is ignored by Git.
- Password fields are rejected.
- Payment-related actions are rejected.
- Arbitrary JavaScript actions are rejected.
- Test timeout and step limits are enforced.

## Four-day delivery plan

### Day 1: Product foundation

- Create the Next.js project.
- Create the demo target website.
- Add the test setup UI.
- Add the results UI with mock data.
- Add responsive styling.

### Day 2: Browser execution

- Install and configure Playwright.
- Implement navigate, click, fill, and verify.
- Capture screenshots.
- Capture console errors.
- Add timeout and step limits.

### Day 3: AI integration

- Add structured test planning.
- Validate AI output with Zod.
- Add AI bug analysis.
- Connect real run results to the dashboard.
- Add failure and retry states.

### Day 4: Quality and submission

- Test all demo flows.
- Improve the visual design.
- Deploy the app publicly.
- Write setup instructions.
- Record a maximum three-minute demo.
- Prepare a five-to-seven-slide deck.
- Verify that the public repository and hosted URL work without private credentials.

## Three-minute demo script

### 0:00–0:20 — Problem

“Small teams lose time manually testing user flows and often discover bugs only after release.”

### 0:20–0:45 — Input

Enter the demo website URL and the task:

```text
Submit the contact form and verify that a success message appears.
```

### 0:45–1:30 — AI and browser execution

Show the generated steps and the live progress timeline.

### 1:30–2:05 — Failure evidence

Show the failed screenshot, failed step, current URL, and console error.

### 2:05–2:40 — Bug report

Show severity, reproduction steps, expected versus actual behavior, and suggested fix.

### 2:40–3:00 — Product value

“ShipCheck turns a product requirement into a repeatable test and gives developers evidence they can act on.”

## Definition of done

The MVP is ready when:

- A judge can open the public URL.
- A judge can enter a website and task.
- ShipCheck produces a structured test plan.
- Playwright performs the test.
- The UI shows live or simulated step progress.
- A failure produces screenshot evidence.
- The AI produces a readable bug report.
- The app handles invalid input and timeouts safely.
- The repository contains setup instructions.
- The demo can be completed in under three minutes.

## Future roadmap

After the hackathon, possible additions include:

- GitHub issue creation.
- Pull-request suggestions.
- Scheduled regression tests.
- Accessibility checks.
- API and network assertions.
- Cross-browser testing.
- Team workspaces.
- Test history and trend reports.
- Human approval before running sensitive actions.

