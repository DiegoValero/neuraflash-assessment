# NeuraFlash QA Assessment - Diego Alejandro Valero Carvajal

### Salesforce Automation Framework — Playwright · TypeScript · Groq LLM

---

## Overview

This framework automates two assessment tasks for the NeuraFlash QA Automation Consultant role:

- **Task 1** — Salesforce Lead creation and extraction automation with AI-powered test data generation and assertion reasoning
- **Task 2** — Agentforce conversational agent testing with intent-based AI evaluation

The framework combines traditional Playwright UI automation with LLM-powered validation, demonstrating that modern QA goes beyond static assertions — it can reason about outcomes the same way a human tester would.

---

## Architecture

## Architecture
```
neuraflash-assessment/
├─ src/
│  ├─ auth/            authCLI.ts, salesforceAuth.ts   — Session management
│  ├─ config/          env.ts                           — Typed env variable loader
│  ├─ constants/       prompts.ts                       — All AI prompts centralized
│  │                   agentforceScenarios.ts           — Task 2 test scenarios
│  ├─ types/           ai.ts, lead.ts, report.ts        — TypeScript interfaces by domain
│  ├─ utils/           fileUtils.ts, dateUtils.ts,
│  │                   jsonUtils.t , locatorUtils.ts,
│  │                   runId.ts, runStore.ts            — Granular utility functions
│  ├─ services/        OpenAIClient.ts                  — LLM base client (Groq)
│  │                   aiLeadService.ts                 — AI Role 1: Data generation
│  │                   aiSummaryService.ts              — AI Role 2: Report summarization
│  │                   aiAssertionService.ts            — AI Role 3a: Lead creation assertion
│  │                   aiAgentEvaluatorService.ts       — AI Role 3b: Intent evaluation
│  │                   reportService.ts                 — JSON + HTML report builder
│  ├─ pages/           BasePage.ts, SalesforceLoginPage.ts,
│  │                   SalesforceHomePage.ts, LeadFormPage.ts,
│  │                   LeadsListPage.ts, AgentforceWidgetPage.ts
│  ├─ flows/           salesforceLoginFlow.ts, createLeadFlow.ts,
│  │                   extractLeadsFlow.ts, agentConversationFlow.ts
│  └─ fixtures/        testHooks.ts                    — Playwright extended fixtures
└─ tests/
   ├─ task1/           salesforce-leads.spec.ts
   └─ task2/           agentforce-widget.spec.ts
```

### Design Decisions

- **Flows layer** sits between tests and pages. Tests stay readable as documentation. Flows own orchestration logic.
- **Fixtures** centralize session setup (SF login, widget open) — no repetition across specs.
- **Prompts as constants** — all AI prompts centralized in one file, easy to tune and version.
- **Types by domain** — `ai.ts`, `lead.ts`, `report.ts` instead of one monolithic interfaces file.
- **RUN_ID** — every execution generates a unique ID that links the 1A and 1B partial reports together, avoiding stale data from previous runs.

---

## Setup

### 1. Install Dependencies

```bash
npm install
npx playwright install chromium
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Fill in your `.env`:

```env
SF_USERNAME=your.user@example.com
SF_PASSWORD=YourPassword123
SF_BASE_URL=https://your-org.develop.my.salesforce.com
SF_LOGIN_URL=https://login.salesforce.com

GROQ_API_KEY=gsk_your_groq_api_key
GROQ_DEPLOYMENT=llama-3.3-70b-versatile

AF_LOGIN_URL=

HEADLESS=false
AI_CONFIDENCE_THRESHOLD=0.75
```

## Authentication — Session Storage

This framework uses **Playwright's `storageState`** to persist browser sessions to disk. Authentication happens once manually; all subsequent test runs reuse the saved session without any login interaction.

```bash
# Save Salesforce session (opens browser — complete any MFA manually)
npm run auth:sf

# Save both sessions at once
npm run auth:all
```

Sessions are saved to `playwright/.auth/` which is excluded from git via `.gitignore` — credentials never reach version control.

### Why Session Storage?

Without session storage, every test run triggers a full login including Salesforce's **email verification** (the code sent to your inbox when logging in from an unrecognized IP). Session storage eliminates this entirely — the browser already holds a valid authenticated session.

> **Best Practice for CI/CD:** The most robust long-term solution is to disable the email verification requirement in your Salesforce org under and add your machine's IP as a trusted range. This allows fully headless, unattended login without any manual intervention. For developer orgs you can also set the trusted IP range to `0.0.0.0 – 255.255.255.255` to trust all IPs during development.

Session files are automatically validated before each test run. If the session has expired (default: 2 hours), the framework will prompt for a fresh login.

---

## Running Tests
```bash
# ── Full runs (clean + test + allure report in one command) ──────────────────

# Task 1 only — Lead creation + extraction
npm run test:task1:full

# Task 2 only — Agentforce scenarios
npm run test:task2:full

# Both tasks
npm run test:all:full

# ── Individual steps (when you need more control) ────────────────────────────

# Run tests without opening Allure
npm run test:task1
npm run test:task2
npm run test:all

# Generate and open Allure report manually
npm run allure:generate
npm run allure:open
```

> The `:full` commands automatically clean previous Allure results, run the tests,
> generate the report, and open it in the browser — no extra steps needed.

---

## Task 1 — Salesforce Lead Automation

### What It Does

**Test 1A — Lead Creation:**

1. AI generates a realistic Lead record (name, company, email, phone, status) — no hardcoded values, unique on every run
2. Navigates to Salesforce like a real user: **App Launcher → Sales app → Leads list → New button**
3. Fills the Lead form and saves
4. Captures the toast confirmation message and waits for the record detail page to load
5. Runs **two layers of assertion**:
   - **Deterministic (Playwright):** Verifies the record name contains the expected last name, the URL matches the Lead detail pattern, and the page contains `/lightning/r/`
   - **AI reasoning (Groq):** Evaluates the full page evidence (URL, toast message, visible text) and returns a structured verdict with confidence score and reasoning

**Test 1B — Lead Extraction and Reporting:**

1. Navigates to the Leads list view — again via real user clicks through the App Launcher and Sales nav
2. Selects the **All Leads** view (clicks the dropdown, selects the unfiltered view)
3. Scrolls through the list to trigger lazy rendering of all rows (Salesforce Lightning uses virtual scrolling)
4. Extracts all Lead records with pagination support
5. Groups records by Lead Status with counts and percentages
6. AI generates a professional summary paragraph of the pipeline distribution
7. Saves a combined JSON + HTML report

> **Navigation note:** The framework intentionally navigates to the Leads list via UI clicks (App Launcher → Sales → Leads) rather than going directly to `/lightning/o/Lead/list`. This simulates a real user flow, which better validates the application's navigation integrity. A direct URL approach would be faster but would skip validating that the app navigation works correctly.

### Selector Strategy

Salesforce Lightning uses Web Components with Shadow DOM, which makes standard CSS class selectors unreliable. The selectors used in this framework follow a priority order: `getByRole` with explicit ARIA labels when available, CSS attribute selectors using the Salesforce field API name when ARIA is not available, and CSS class selectors only as a last resort.

---

## Task 2 — Agentforce Agent Interaction Testing

### What It Does

Tests 5 conversational scenarios against the Agentforce agent on `help.salesforce.com`:

| Scenario | Input | Intent Tested |
|---|---|---|
| 1 | "Hi, what can you help me with?" | Capability overview |
| 2 | "How do I set up Flow Builder?" | Feature guidance |
| 3 | "I cannot log in to my Salesforce org" | Troubleshooting |
| 4 | "Can you book me a flight to New York?" | Out-of-scope deflection |
| 5 | "What is Agentforce vs regular chatbots?" | Product differentiation |

For each scenario the framework fills the question in the inline chat input on the Help Portal, submits it, waits for the agent to finish streaming its response (detected by text stabilization, not arbitrary sleeps), and then passes the response to the AI evaluator.

### Why Intent-Based Validation

Agentforce is LLM-powered — responses are non-deterministic. The same question yields different phrasings, lengths, and structures across runs. Hardcoded expected strings produce flaky tests that fail on synonyms, not real failures.

The AI evaluator receives the agent response + expected intent + specific validation criteria and returns `{ passed, confidence, reasoning, keyEvidence }`. The **confidence threshold** (default: `0.75`) prevents low-confidence verdicts from being accepted — if the AI evaluator itself is uncertain, the test fails.

### Widget Architecture
The Agentforce widget on the Help Portal loads inside a nested iframe (iframe.embeddedMessagingFrame). The framework handles this by:
Using Playwright's frameLocator() API to interact with elements inside the iframe without manual frame switching
Detecting response completion via text stabilization (polling until the response text stops changing) rather than arbitrary sleep timers
Scrolling the last agent message into view before taking screenshots to capture the complete response
Capturing response time per scenario — measured from message submission to response stabilization. This metric is passed to the AI evaluator as informational context and is visible in both the Allure report and the HTML/JSON output files. Response time currently does not affect the pass/fail verdict — a slow response with correct content still passes, keeping content quality and performance as separate measurable concerns

### Response Capture Strategy
The framework detects when the agent has finished streaming its response by polling the text content of the last inbound message and waiting for it to be identical across two consecutive checks 800ms apart. This is more reliable than checking for a visual indicator because Salesforce shows the timestamp before streaming is complete.



---

## AI Integration — 3 Roles

### Role 1 — Test Data Generator
Generates a realistic Salesforce Lead before each run. No hardcoded values — name, company, email domain, and phone are all contextually coherent. Industry varies across runs (SaaS, fintech, healthcare, logistics, retail tech).

### Role 2 — Report Summarizer
After extracting all Lead records, converts raw status distribution metrics into a human-readable paragraph. States totals, highlights dominant and underrepresented statuses, and provides a pipeline observation.

### Role 3 — Assertion Reasoner (two contexts)
- **Task 1:** Evaluates page evidence (URL, toast, visible text) after Lead creation to reason about whether the operation succeeded.
- **Task 2:** Evaluates Agentforce responses against expected intent and validation criteria.

---

## Output Artifacts

Every execution generates a unique `RUN_ID` (timestamp-based) that ties all output files together. Previous runs are never overwritten — you keep a full history.

### Reports generated per run

| File | Description |
|------|-------------|
| `reports/html/task1-report.{RUN_ID}.html` | Visual HTML report for Task 1 — shows lead data, AI assertion reasoning, leads distribution chart, and AI summary |
| `reports/html/task2-report.{RUN_ID}.html` | Visual HTML report for Task 2 — shows pass/fail per scenario with agent response, AI reasoning, and key evidence |
| `reports/json/task1-report.{RUN_ID}.json` | Raw Task 1 data: lead record, creation evidence, extraction results, status distribution, AI summary |
| `reports/json/task2-report.{RUN_ID}.json` | Raw Task 2 data: all 5 scenario results with full AI verdicts and response times |
| `reports/screenshots/` | Per-step screenshots — Lead detail page after creation, Agentforce chat after each response |
| `allure-report/` | Interactive Allure report with timeline, steps, attachments, and pass/fail breakdown |

### Opening the reports
```bash
# HTML reports — open directly in browser
open reports/html/task1-report.*.html
open reports/html/task2-report.*.html

# Allure report — generated and opened automatically with :full commands
npm run allure:generate
npm run allure:open
```

### What the HTML reports show

**Task 1 report** includes the AI-generated lead data, the deterministic and AI assertion results with confidence percentage and full reasoning, the complete leads distribution table grouped by status with percentages, and the AI-generated pipeline summary paragraph.

**Task 2 report** includes a pass rate summary, and for each scenario: the exact user input sent, the full agent response captured, any links found in the response, the AI evaluator's reasoning, and the key evidence quote that most supported the verdict.

---

## Known Limitations & Future Work

### Current Limitations

- AI evaluation confidence is calibrated for `llama-3.3-70b-versatile` on Groq. Other models may need threshold tuning via `AI_CONFIDENCE_THRESHOLD` in `.env`.
- The Salesforce session expires after approximately 2 hours of inactivity. This requires running `npm run auth:sf` to refresh manually — fully resolved by configuring a Trusted IP Range, which eliminates email verification entirely and enables headless unattended login.
- Some flows interact with Salesforce exclusively through the UI (App Launcher navigation, form filling, list scrolling). Many of these could be replaced or supplemented with direct Salesforce REST API calls for faster and more stable execution — the UI approach was chosen intentionally for this assessment to demonstrate end-to-end user flow validation.

### Future Improvements

- **CI/CD Integration** — plug the test suite into GitHub Actions, Jenkins, or Azure DevOps to run on every pull request or on a scheduled trigger, with Allure reports published as pipeline artifacts and Slack/email notifications on failure.

- **AI-Powered Execution Intelligence** — persist all test results (pass/fail, confidence scores, response times, AI reasoning) to a database and feed historical runs to an LLM. The AI would analyze patterns across executions to detect flaky tests, identify which scenarios are trending toward failure before they actually fail, explain *why* a test is flaky based on the reasoning history, and recommend threshold adjustments. Instead of static rules, the system learns from its own test history.

- **AI Test Maintenance** — when a Salesforce UI update breaks a selector, instead of manually hunting for the new element, an AI agent inspects the DOM diff, proposes updated selectors, and opens a pull request with the fix — reducing maintenance burden to a review step.

- **Predictive Quality Gates** — before a Salesforce release, run the suite and feed the results to an LLM that cross-references the execution data with the release notes to predict which flows are most likely to be affected, flagging them for human review before they reach production.

- **Salesforce API Layer** — add an optional API-based flow alongside the UI flows for scenarios where speed matters more than navigation validation (e.g., bulk lead seeding, data cleanup between runs).

- **Multi-org Support** — parameterize the framework to run against multiple Salesforce orgs (dev, staging, production) in a single pipeline execution, with AI-generated comparison reports highlighting behavioral differences between environments.
