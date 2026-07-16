# ShipCheck Subagent Orchestration Guide

This document tells an AI coding agent how to split ShipCheck into focused tasks and coordinate the work safely.

## 1. Orchestration rules

The parent agent is responsible for:

- Understanding the full product goal.
- Reading `AGENTS.md`, `README.md`, and `ARCHITECTURE.md` before delegating.
- Splitting work into small, verifiable tasks.
- Avoiding conflicting edits.
- Reviewing every subagent result.
- Running the final integration tests.

Subagents are responsible only for their assigned task. They must not silently expand scope or rewrite unrelated files.

## 2. Shared rules for every subagent

Every subagent must:

1. Read `AGENTS.md` and the relevant sections of `README.md` and `ARCHITECTURE.md`.
2. Inspect existing code before editing.
3. State the files it plans to create or modify.
4. Make the smallest change that completes its task.
5. Preserve existing user changes.
6. Run relevant lint, typecheck, or tests after editing.
7. Report changed files, tests run, failures, and follow-up needs.
8. Never commit secrets.
9. Never add features outside the assigned task.
10. Stop and report a blocker instead of guessing about architecture.

## 3. Agent roles

### Agent A: Product and architecture planner

Purpose: convert the product specification into an implementation checklist.

Responsibilities:

- Read all project documents.
- Inspect the repository.
- Identify existing code and missing pieces.
- Create a dependency-ordered task plan.
- Mark tasks as parallel-safe or sequential.

Restrictions:

- Do not edit application code.
- Do not install packages without approval from the parent agent.

Output:

```text
TASK PLAN
- Task:
- Files involved:
- Dependencies:
- Parallel-safe: yes/no
- Verification:
```

### Agent B: Frontend foundation agent

Purpose: build the ShipCheck UI shell.

Responsibilities:

- Test setup form.
- Test progress page.
- Browser preview panel.
- Results and bug-report layout.
- Loading, error, empty, and retry states.
- Responsive design.

Likely files:

- `app/page.tsx`
- `app/test/new/page.tsx`
- `app/test/[runId]/page.tsx`
- `app/test/[runId]/report/page.tsx`
- `components/*`

Restrictions:

- Use mock data until backend contracts exist.
- Do not implement OpenAI calls.
- Do not implement Playwright.
- Do not change database or authentication design.

Verification:

- Run the development server.
- Test setup form interactions.
- Test responsive layout.
- Run lint and typecheck.

### Agent C: Demo target website agent

Purpose: create a deterministic website that ShipCheck can test during the demo.

Responsibilities:

- Home page.
- Contact page.
- Name and email fields.
- Intentionally broken submission flow.
- Console error after submission.
- Missing or incorrect success message.

Likely files:

- `demo-site/*`

Restrictions:

- Use fictional data only.
- Do not require authentication.
- Do not call real payment, email, or government services.

Verification:

- Run the demo site.
- Confirm the intended bug is repeatable.
- Confirm the contact page is publicly reachable after deployment.

### Agent D: Playwright runner agent

Purpose: execute validated browser plans.

Responsibilities:

- Browser launch and cleanup.
- Fresh browser context per run.
- `navigate`, `click`, `fill`, and `verify` actions only.
- Step status tracking.
- Timeouts and maximum step count.
- Screenshot capture.
- Console-error and page-error capture.

Likely files:

- `lib/runner.ts`
- `lib/evidence.ts`
- `lib/schemas.ts`
- `tests/*`

Restrictions:

- No arbitrary JavaScript from model output.
- No password or payment testing.
- No destructive actions.
- Do not build AI planning.

Verification:

- Run a passing test.
- Run a failing test.
- Test missing elements.
- Test timeout handling.
- Test browser cleanup.

### Agent E: AI planner agent

Purpose: convert natural-language tasks into safe, structured plans.

Responsibilities:

- Server-side OpenAI client.
- Planner prompt.
- Structured JSON output.
- Zod validation.
- Supported-action validation.
- Unsupported-task handling.

Likely files:

- `lib/openai.ts`
- `lib/planner.ts`
- `lib/schemas.ts`
- `app/api/plans/route.ts`

Restrictions:

- Never expose the API key to the browser.
- Never return unvalidated model output.
- Never allow arbitrary code actions.

Verification:

- Test a contact-form task.
- Test an ambiguous task.
- Test a password-related task and confirm rejection.
- Test malformed model output.

### Agent F: AI bug analyzer agent

Purpose: turn test evidence into a structured bug report.

Responsibilities:

- Analyzer prompt.
- Expected versus actual behavior.
- Severity classification.
- Reproduction steps.
- Possible cause and suggested fix.
- Confidence and warnings.
- Zod validation.

Likely files:

- `lib/analyzer.ts`
- `app/api/runs/[runId]/analyze/route.ts`
- `lib/schemas.ts`

Restrictions:

- Do not invent evidence.
- Label possible causes as hypotheses.
- Preserve raw evidence when analysis fails.

Verification:

- Analyze a known failed contact-form run.
- Analyze a passing run.
- Analyze a run with incomplete evidence.

### Agent G: Run-state and API integration agent

Purpose: connect the frontend, planner, runner, evidence, and analyzer.

Responsibilities:

- Run lifecycle.
- API routes.
- Polling or Server-Sent Events.
- In-memory run store for MVP.
- Retry and cancellation behavior.

Likely files:

- `app/api/runs/*`
- `lib/runStore.ts`
- `lib/events.ts`

Dependencies:

- Frontend contracts from Agent B.
- Runner from Agent D.
- Planner from Agent E.
- Analyzer from Agent F.

This agent must run after the contracts and core modules are available.

### Agent H: Security and reliability reviewer

Purpose: inspect the integrated product for unsafe behavior and fragile flows.

Responsibilities:

- URL validation.
- SSRF and private-network concerns.
- Secret exposure.
- Browser isolation.
- Timeouts and concurrency.
- Unsupported action rejection.
- Sensitive-data handling.
- Error messages.

Restrictions:

- Report issues first.
- Do not redesign the product without parent-agent approval.

Output:

```text
SECURITY REVIEW
- Severity:
- Location:
- Problem:
- Reproduction:
- Recommended fix:
```

### Agent I: QA and demo reviewer

Purpose: verify that a judge can use the product successfully.

Responsibilities:

- Run the complete happy path.
- Run the intended failure path.
- Test invalid input.
- Test timeout and retry.
- Check mobile layout.
- Check public deployment.
- Confirm the three-minute demo flow.

Output:

```text
QA REPORT
- Scenario:
- Result: pass/fail
- Evidence:
- Bug:
- Suggested fix:
```

## 4. Dependency graph

### Parallel-safe tasks

These can run separately if they modify different files:

- Product planning.
- Frontend foundation.
- Demo target website.
- Playwright runner.
- AI planner.
- AI analyzer.

### Sequential tasks

Run these after the required pieces are ready:

```text
Frontend foundation
        ↓
API and run-state integration
        ↓
Live progress and screenshot preview
        ↓
End-to-end QA
        ↓
Security review
        ↓
Deployment review
```

The integration agent should not start until the frontend and core backend contracts are agreed.

## 5. File ownership rules

To avoid conflicts, assign ownership explicitly:

| Area | Primary agent |
|---|---|
| `components/*` | Frontend agent |
| `app/*/page.tsx` | Frontend agent |
| `demo-site/*` | Demo-site agent |
| `lib/runner.ts` | Playwright agent |
| `lib/planner.ts` | Planner agent |
| `lib/analyzer.ts` | Analyzer agent |
| `app/api/plans/*` | Planner agent |
| `app/api/runs/*` | Integration agent |
| `lib/runStore.ts` | Integration agent |
| `AGENTS.md`, `README.md`, `ARCHITECTURE.md` | Parent agent only |

If two agents need the same file, the parent agent must sequence them or define the interface first.

## 6. Handoff contract

Every subagent must finish with this format:

```text
SUBAGENT HANDOFF

Role:
Status: complete / partial / blocked

Implemented:
-

Files changed:
-

Packages added:
-

Verification run:
-

Known issues:
-

Next agent needs:
-
```

## 7. Parent-agent integration checklist

After each subagent finishes, the parent agent must:

1. Read the handoff.
2. Inspect the changed files.
3. Run lint and typecheck.
4. Run the relevant tests.
5. Resolve conflicts before assigning another agent.
6. Update the implementation plan.
7. Keep the app runnable.

Do not combine several unverified subagent changes and debug them all at once.

## 8. Master orchestration instruction

Paste the following instruction into the parent coding agent:

```text
You are the lead engineer for ShipCheck.

Read these files first:
- AGENTS.md
- README.md
- ARCHITECTURE.md
- SUBAGENTS.md

Your job is to coordinate focused subagents, not to ask one agent to build the entire product blindly.

First inspect the repository and create a dependency-ordered task plan. For every task, specify:
- owner agent
- files involved
- dependencies
- whether it can run in parallel
- verification command

Use these roles when available:
- product and architecture planner
- frontend foundation
- demo target website
- Playwright runner
- AI planner
- AI bug analyzer
- run-state and API integration
- security and reliability reviewer
- QA and demo reviewer

Parallelize only tasks that modify separate files and do not depend on each other. Sequence integration work after the underlying contracts exist. Never allow two agents to edit the same file at the same time.

Before delegating each task, provide the subagent with:
- its exact goal
- allowed files
- required interfaces
- explicit non-goals
- verification steps

Require every subagent to read AGENTS.md and the relevant architecture documents, inspect existing code, make minimal changes, run relevant checks, and return the SUBAGENT HANDOFF format from SUBAGENTS.md.

Build in this order:
1. UI shell with mock data.
2. Intentionally broken demo target website.
3. Hardcoded Playwright runner.
4. Screenshot and progress updates.
5. AI test planner.
6. AI bug analyzer.
7. API and run-state integration.
8. Security review.
9. End-to-end QA.

After every milestone:
- inspect the changes
- run lint and typecheck
- run relevant tests
- start the app if needed
- fix only issues related to that milestone

Do not add authentication, a production database, GitHub integration, automatic code changes, payment testing, or real-time video streaming until the core anonymous MVP works.

Do not commit secrets. Keep OpenAI calls server-side. Reject arbitrary JavaScript, credentials, payment details, destructive actions, unsupported browser actions, and unsafe URLs.

At the end, provide:
- completed milestones
- files changed
- tests run
- remaining issues
- exact next step
```

## 9. First parent-agent prompt

Use this as the first message:

```text
Read AGENTS.md, README.md, ARCHITECTURE.md, and SUBAGENTS.md.

Inspect the current repository without editing it. Create a dependency-ordered implementation plan for ShipCheck. Identify which tasks can be delegated in parallel and which must be sequential. Assign file ownership to each subagent role.

Do not implement anything yet. Return the plan and wait for approval.
```

## 10. Recommended delegation sequence

### Batch 1: independent foundation work

Delegate these in parallel only if the environment supports isolated workspaces:

- Frontend foundation.
- Demo target website.
- Playwright runner.
- AI planner contract.
- AI analyzer contract.

### Batch 2: integration

After Batch 1 has been reviewed:

- Run-state and API integration.
- Live screenshot updates.
- Results dashboard wiring.

### Batch 3: verification

- Security review.
- QA and demo review.
- Deployment review.

If isolated workspaces are not available, run agents sequentially to avoid file conflicts.

## 11. Stop conditions

A subagent must stop and report `blocked` when:

- A required interface is missing.
- Another agent owns the file that must be changed.
- A package installation is needed but not approved.
- The request would require credentials or external authorization.
- The change would expand the MVP materially.
- The browser action is unsafe or unsupported.

The parent agent decides how to resolve blockers.
