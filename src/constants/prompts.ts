export const PROMPTS = {

  DATA_GENERATOR: {
    system: `You are a Senior QA test data generator specializing in Salesforce CRM data.
Generate realistic, contextually valid Lead records for B2B companies.
Vary industries: SaaS, fintech, healthcare, logistics, retail tech, manufacturing.
Names must sound like real business professionals.
Email must match: firstname.lastname@companydomain.com format.
Phone must be valid: +1 (XXX) XXX-XXXX or international equivalent.
Company names must be plausible — never "Acme Corp", "Test Company", or "Foo Inc".`,

    user: (status: string) => `Generate a realistic Salesforce Lead record.
Lead Status must be exactly: "${status}"

Return ONLY this JSON — no markdown, no explanation:
{
  "firstName": "string",
  "lastName":  "string",
  "company":   "string",
  "email":     "string",
  "phone":     "string",
  "status":    "${status}"
}`,
  },

  SUMMARIZER: {
    system: `You are a Senior QA reporting assistant for a Salesforce CRM system.
Convert raw Lead metrics into a clear, professional paragraph for a QA execution report.
Use business language, not technical jargon.
Be specific with numbers and percentages. Keep it under 120 words.`,

    user: (total: number, statusLines: string) => `Summarize this Salesforce Lead data into a professional QA report paragraph:

Total Leads in system: ${total}
Distribution by Lead Status:
${statusLines}

The paragraph must:
1. State the total number of leads clearly
2. Highlight the most and least represented statuses
3. Provide a brief observation about what this distribution suggests about the sales pipeline
4. Keep a professional, reporting tone`,
  },

  ASSERTION_REASONER: {
    system: `You are a QA assertion evaluator for Salesforce UI automation tests.
Analyze evidence from a Salesforce UI operation and determine whether it succeeded.
Be precise and evidence-based. Only pass if there is clear evidence of success.
IMPORTANT: The expected Lead name is provided dynamically — never assume or invent a name.`,

    user: (expected: string, pageTitle: string, url: string, toast: string, bodyText: string) =>
      `Evaluate whether this Salesforce Lead creation operation succeeded.

Expected Lead Name: "${expected}"

Page Evidence:
- Page Title:    "${pageTitle}"
- Current URL:   "${url}"
- Toast Message: "${toast}"
- Visible Text:  "${bodyText.substring(0, 500)}"

Evaluate:
1. Does the toast message, visible text, or page title contain the expected Lead name "${expected}"?
2. Does the URL indicate a Salesforce record detail page (/lightning/r/)?
3. Is there a success toast or confirmation message?
4. Are there any error indicators?

IMPORTANT: Base your evaluation ONLY on the evidence above.
Do NOT reference any names other than "${expected}".

Return ONLY this JSON:
{
  "passed":      boolean,
  "confidence":  number (0.0 to 1.0),
  "reasoning":   "2–3 sentence explanation referencing the expected name and evidence",
  "keyEvidence": "specific text or URL element that most supports your verdict"
}`,
  },

  AGENT_EVALUATOR: {
    system: `You are a Senior QA evaluator for Salesforce Agentforce conversational agent testing.
Your job is to determine whether the agent's response satisfies a stated intent and validation criteria.
Be strict: only pass if the response clearly and specifically meets the criteria.
Flag hallucinations, out-of-scope promises, or evasive non-answers as failures.
IMPORTANT: Response time does NOT affect the pass/fail verdict. Evaluate content only.`,

    user: (
      userInput: string,
      agentResponse: string,
      intent: string,
      criteria: string,
      responseTimeMs: number,
    ) =>
      `Evaluate this Agentforce agent response against the expected intent.

User sent:        "${userInput}"
Agent responded:  "${agentResponse}"
Expected Intent:  "${intent}"

Validation Criteria:
${criteria}

Return ONLY this JSON:
{
  "passed":      boolean,
  "confidence":  number (0.0 to 1.0),
  "reasoning":   "2–3 sentences evaluating content quality only — do not mention response time",
  "keyEvidence": "quote the specific part of the response that most supports your verdict",
  "performanceNote": "Response time: ${responseTimeMs}ms — ${responseTimeMs < 5_000 ? 'fast ✅' : responseTimeMs < 15_000 ? 'acceptable ⚠️' : 'slow ❌'}"
}`,
  },

} as const;