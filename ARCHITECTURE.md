# ShipCheck Architecture

## 1. Product goal

ShipCheck converts a natural-language website task into a safe browser test, runs it with Playwright, streams progress and screenshots, and produces an evidence-backed bug report.

```text
Natural-language task
        ↓
AI test planner
        ↓
Validated JSON plan
        ↓
Playwright browser runner
        ↓
Screenshots + console errors + step results
        ↓
AI bug analyzer
        ↓
Bug report
```

The AI plans and explains. Playwright performs deterministic browser actions. The model must never execute arbitrary browser code.

## 2. Recommended stack

- Next.js and TypeScript.
- Tailwind CSS.
- OpenAI Responses API, called only from the server.
- Zod for validating every AI response.
- Playwright with Chromium for browser automation.
- Vercel for the frontend/API deployment.
- Supabase Postgres and Storage later, after the MVP works.
- Redis or a hosted queue later, when browser jobs need to run asynchronously.

## 3. MVP architecture

```text
┌─────────────────────┐
│ Browser UI           │
│ Setup / Progress /   │
│ Results              │
└──────────┬──────────┘
           │ HTTPS + polling/SSE
           ▼
┌─────────────────────┐
│ Next.js server      │
│ API routes          │
└──────┬──────┬───────┘
       │      │
       ▼      ▼
┌──────────┐ ┌──────────────┐
│ OpenAI   │ │ Playwright  │
│ planner  │ │ runner      │
└────┬─────┘ └──────┬───────┘
     │              │
     ▼              ▼
┌──────────┐ ┌──────────────┐
│ Zod      │ │ Evidence    │
│ validator│ │ collector   │
└──────────┘ └──────┬───────┘
                    ▼
             ┌──────────────┐
             │ OpenAI       │
             │ bug analyzer │
             └──────────────┘
```

For the hackathon, use in-memory run state or temporary files. Add a database only after the end-to-end flow works.

## 4. Project structure

```text
app/
  page.tsx
  test/new/page.tsx
  test/[runId]/page.tsx
  test/[runId]/report/page.tsx
  api/plans/route.ts
  api/runs/route.ts
  api/runs/[runId]/route.ts
  api/runs/[runId]/events/route.ts
  api/runs/[runId]/analyze/route.ts

components/
  TestSetupForm.tsx
  RunHeader.tsx
  StepTimeline.tsx
  LiveBrowserPreview.tsx
  EvidencePanel.tsx
  ConsoleErrors.tsx
  BugReport.tsx
  SeverityBadge.tsx

lib/
  openai.ts
  planner.ts
  analyzer.ts
  runner.ts
  evidence.ts
  schemas.ts
  urlValidation.ts
  runStore.ts

demo-site/
  app/
  public/

public/
  demo-screenshots/
```

## 5. UI pages

### `/`

Landing page with:

- Product statement.
- Three-step explanation: describe, test, fix.
- `Start testing` button.
- Short safety notice.

### `/test/new`

Test setup page:

- Website URL input.
- Task textarea.
- Expected-result textarea.
- Safety notice.
- Run Test button.

Validation states:

- Empty URL.
- Invalid URL.
- Empty task.
- Unsupported URL protocol.
- Planner error.

### `/test/:runId`

Live test page:

```text
┌─────────────────────────────────────────────┐
│ ShipCheck       Running / Failed / Passed   │
├───────────────────┬─────────────────────────┤
│ Step timeline     │ Latest browser screenshot│
│ ✓ Opened page     │                         │
│ ✓ Filled name     │                         │
│ ⟳ Clicking Submit │                         │
│ ○ Verify message  │                         │
├───────────────────┴─────────────────────────┤
│ Current URL / console errors / run details   │
└─────────────────────────────────────────────┘
```

### `/test/:runId/report`

Results page:

- Pass/fail summary.
- Run metadata.
- Step timeline.
- Screenshots.
- Console errors.
- Expected versus actual behavior.
- Severity.
- Reproduction steps.
- Possible cause.
- Suggested fix.
- Confidence and warnings.
- Retry, Copy Report, and Download JSON actions.

### `/history` — later

Saved runs, projects, filters, and previous reports. Do not build this before the anonymous MVP works.

## 6. Authentication design

### Hackathon MVP: no authentication

Do not require sign-in for the public demo. A judge should be able to open the app and run a test immediately.

Use these MVP protections instead:

- Anonymous run ID.
- Maximum 10 steps.
- Maximum 60 seconds per run.
- Maximum 15 seconds per action.
- No real credentials.
- No payment or destructive actions.
- Rate limiting where available.

### Production authentication

Use managed OAuth or magic-link authentication, for example through Supabase Auth.

```text
User signs in
    ↓
Auth provider creates session
    ↓
Next.js middleware validates session
    ↓
API route gets user ID
    ↓
Every project and run query is scoped to that user
```

Never store raw passwords. In production, every project and run must be authorized by user or project membership.

Roles:

- `owner`: manage project and members.
- `editor`: create and run tests.
- `viewer`: read runs and reports.

## 7. API design

Use a consistent error format:

```json
{
  "error": {
    "code": "INVALID_URL",
    "message": "Enter a valid public HTTP or HTTPS URL.",
    "requestId": "req_123"
  }
}
```

### `POST /api/plans`

Creates a validated plan.

Request:

```json
{
  "url": "https://demo.shipcheck.app",
  "task": "Submit the contact form and verify the success message.",
  "expectedResult": "A success message should be visible."
}
```

Response:

```json
{
  "plan": {
    "id": "plan_123",
    "goal": "Submit the contact form and verify the success message.",
    "status": "validated",
    "steps": []
  }
}
```

### `POST /api/runs`

Creates and starts a run.

Request:

```json
{
  "url": "https://demo.shipcheck.app",
  "planId": "plan_123"
}
```

Response:

```json
{
  "run": {
    "id": "run_123",
    "status": "created"
  }
}
```

### `GET /api/runs/:runId`

Returns the current run state.

```json
{
  "run": {
    "id": "run_123",
    "status": "running",
    "progress": 60,
    "steps": [],
    "latestEvidence": null,
    "consoleErrors": []
  }
}
```

### `GET /api/runs/:runId/events`

Optional Server-Sent Events endpoint. For the simplest MVP, poll `GET /api/runs/:runId` every 1–2 seconds.

Example events:

```text
event: step_started
data: {"stepId":"step-3","description":"Click Submit"}

event: evidence
data: {"stepId":"step-3","screenshotUrl":"/evidence/abc.jpg"}

event: step_finished
data: {"stepId":"step-3","status":"failed"}

event: run_finished
data: {"runId":"run_123","status":"failed"}
```

### `POST /api/runs/:runId/analyze`

Creates the bug report from completed evidence.

Request:

```json
{
  "runId": "run_123"
}
```

### `POST /api/runs/:runId/cancel`

Requests cancellation of a running browser job.

## 8. AI contracts

### Test-plan schema

```json
{
  "goal": "Submit the contact form",
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
      "description": "Fill the name field"
    },
    {
      "id": "step-3",
      "action": "click",
      "target": "Submit",
      "description": "Submit the form"
    },
    {
      "id": "step-4",
      "action": "verify",
      "target": "success message",
      "description": "Verify the success message"
    }
  ]
}
```

Supported actions only:

- `navigate`
- `click`
- `fill`
- `verify`

Planner rules:

- JSON only.
- Maximum 10 steps.
- No passwords or payment details.
- No destructive actions.
- No arbitrary JavaScript.
- Reject ambiguous or unsupported tasks instead of guessing.

### Bug-report schema

```json
{
  "status": "failed",
  "title": "Contact form does not display a success message",
  "severity": "high",
  "failedStep": "Verify the success message",
  "expectedBehavior": "A success message should appear.",
  "actualBehavior": "No success message was visible.",
  "reproductionSteps": [
    "Open the contact page",
    "Fill the name field",
    "Click Submit"
  ],
  "observedErrors": ["POST /api/contact returned 500"],
  "possibleCause": "The submission handler may be failing.",
  "suggestedFix": "Render success and error states after the response.",
  "confidence": "medium",
  "warnings": ["The possible cause is a hypothesis."]
}
```

Analyzer rules:

- Treat screenshots, logs, and observed text as the source of truth.
- Separate facts from hypotheses.
- Never invent an error.
- Include warnings when evidence is incomplete.
- Do not claim a test passed without a real verification result.

## 9. Browser runner design

```ts
type RunnerInput = {
  runId: string;
  url: string;
  plan: TestPlan;
};

type RunnerOutput = {
  status: 'passed' | 'failed' | 'timed_out' | 'error';
  steps: StepResult[];
  evidence: Evidence[];
  consoleErrors: ConsoleError[];
};

async function runBrowserTest(input: RunnerInput): Promise<RunnerOutput>;
```

Locator priority:

1. Accessible role and visible name.
2. Associated label.
3. Placeholder.
4. Stable test ID.
5. Safe CSS selector only when necessary.

Before acting, confirm that the element exists, is visible, and is enabled.

After every action capture:

- Step status.
- Current URL.
- Screenshot.
- Console errors since the previous step.
- Relevant visible text.
- Error details if the action failed.

## 10. Run state machine

```text
created → planning → planned → running
                                  ├→ passed
                                  ├→ failed
                                  ├→ timed_out
                                  ├→ cancelled
                                  └→ error
```

Step states:

```text
pending → running → passed
                  ├→ failed
                  ├→ skipped
                  └→ timed_out
```

The server owns the state. The frontend renders state received from the server and never assumes that an action passed merely because a click call returned.

## 11. Database design

### MVP

Use a store interface with an in-memory implementation:

```ts
interface RunStore {
  createRun(input: CreateRunInput): Promise<Run>;
  getRun(id: string): Promise<Run | null>;
  updateRun(id: string, patch: Partial<Run>): Promise<Run>;
  addStepResult(runId: string, result: StepResult): Promise<void>;
  addEvidence(runId: string, evidence: Evidence): Promise<void>;
}
```

### Production tables

#### `users`

Managed by the auth provider.

```text
id, email, created_at, updated_at
```

#### `projects`

```text
id, owner_id, name, base_url, created_at, updated_at
```

#### `project_members`

```text
project_id, user_id, role, created_at
```

Primary key: `project_id + user_id`.

#### `test_runs`

```text
id, project_id, created_by, target_url, task,
expected_result, status, progress, started_at,
finished_at, error_code, created_at
```

#### `test_plans`

```text
id, run_id, version, plan_json, model_name, created_at
```

#### `run_steps`

```text
id, run_id, step_order, action, description,
target_hint, status, started_at, finished_at,
error_message, created_at
```

#### `evidence`

```text
id, run_id, step_id, type, storage_key,
content_json, created_at
```

Evidence types: `screenshot`, `console_error`, `page_error`, `url`, and `text`.

#### `bug_reports`

```text
id, run_id, status, title, severity,
expected_behavior, actual_behavior, reproduction_steps,
observed_errors, possible_cause, suggested_fix,
confidence, warnings, created_at
```

Add indexes on `test_runs.created_by`, `test_runs.project_id`, `test_runs.status`, `run_steps.run_id`, and `evidence.run_id`.

## 12. Storage design

### MVP

Use temporary files or in-memory screenshot data. This is acceptable for a controlled demo only.

### Production

Store screenshots in private object storage:

```text
evidence/{userId}/{runId}/{stepId}/before.jpg
evidence/{userId}/{runId}/{stepId}/after.jpg
```

Store only references and metadata in Postgres.

Use signed URLs, retention limits, and deletion support. Do not make evidence buckets public.

## 13. Live preview design

### MVP

Use screenshot-after-step updates:

1. Playwright performs one action.
2. Runner captures a JPEG screenshot.
3. Server stores or encodes it.
4. Frontend receives the update through polling or SSE.
5. `LiveBrowserPreview` displays the latest frame.

### Later

Use WebSockets and real-time browser screencast frames. Do not implement this until screenshot updates are reliable.

Do not depend on embedding arbitrary sites with an iframe; many sites block framing for security reasons.

## 14. Security design

### URL validation

- Allow only `http` and `https`.
- Reject `file:`, `javascript:`, and `data:` URLs.
- Block private-network targets in production where possible.
- Validate redirects.
- Restrict test duration and concurrency.

### Browser isolation

- Use a fresh browser context per run.
- Disable persistent cookies by default.
- Do not reuse sessions between users.
- Close browser and context after every run.
- Do not accept real credentials in the MVP.

### AI safety

- Treat target-page text as untrusted input.
- Never allow page text to override safety instructions.
- Validate every model response with Zod.
- Reject unsupported actions.
- Do not execute model-generated JavaScript.

### Data safety

- Keep `OPENAI_API_KEY` server-side.
- Never commit `.env.local`.
- Do not store passwords, payment data, or personal information.
- Use private evidence storage in production.
- Delete evidence after a retention period.

## 15. Error handling

### Invalid URL

Return `INVALID_URL` and explain that the user must provide a public HTTP or HTTPS URL.

### Unsupported task

Tell the user that the request could not be safely converted into supported actions. Show examples of supported tasks.

### Browser failure

Show the failed step, error, last screenshot, and Retry button.

### Timeout

Mark the run `timed_out`, preserve evidence, close the browser, and show the last known state.

### Analyzer failure

Show the raw test result and evidence even if AI report generation fails.

Never expose stack traces or secrets to the user.

## 16. Non-goals for the hackathon

Do not build these before the core flow works:

- Authentication.
- GitHub pull requests.
- Automatic code modification.
- Password or payment testing.
- Scheduled monitoring.
- Multi-browser comparison.
- Full accessibility auditing.
- API testing.
- Team workspaces.
- Real-time video streaming.

## 17. Implementation order

1. Build UI screens with mock data.
2. Build the intentionally broken demo website.
3. Implement a hardcoded Playwright plan.
4. Add screenshots, console errors, and progress updates.
5. Add the AI planner.
6. Add the AI analyzer.
7. Add validation, timeouts, and safety controls.
8. Deploy and test from an incognito browser.
9. Record the three-minute demo.

## 18. Definition of done

ShipCheck is ready when:

- A judge can open the public app without signing in.
- A user can enter a URL and task.
- A validated plan is produced.
- Playwright runs the plan.
- Progress and screenshots appear in the UI.
- A failed test produces a structured bug report.
- Invalid URLs and unsupported actions are rejected.
- Timeouts close the browser safely.
- No secret or real credential is required.
- `npm run lint` and `npm run build` pass.
- The complete demo takes less than three minutes.
