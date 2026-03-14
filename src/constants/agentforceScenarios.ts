import { AgentScenario } from '../types/ai';

export const AGENTFORCE_SCENARIOS: AgentScenario[] = [
    {
        id: 1,
        title: 'Greeting & Onboarding Response',
        userInput: 'Hi, what can you help me with?',
        expectedIntent: 'capability overview',
        validationCriteria: `
- Must offer assistance or acknowledge the greeting
- Must mention at least one area of support (e.g., products, features, processes, troubleshooting)
- Mentioning "Salesforce products, features, or processes" counts as covering multiple capability areas
- Should be welcoming in tone
- Must NOT promise capabilities unrelated to Salesforce support
- A brief but relevant scope description is sufficient — verbose detail is not required`,
    },
    {
        id: 2,
        title: 'Documentation / Feature Search',
        userInput: 'How do I set up Flow Builder in Salesforce?',
        expectedIntent: 'feature guidance',
        validationCriteria: `
- Must provide guidance, steps, or a link related to Flow Builder or Salesforce automation
- Must be relevant to Flow Builder specifically — not generic automation advice
- Should reference official documentation or provide actionable steps
- Providing Trailhead or Salesforce Help links counts as actionable guidance`,

    },
    {
        id: 3,
        title: 'Troubleshooting / Error Handling',
        userInput: 'I cannot log in to my Salesforce org. What should I do?',
        expectedIntent: 'troubleshooting steps provided',
        validationCriteria: `
- Must suggest at least one actionable troubleshooting step
- Valid steps: password reset, browser cache, MFA issues, login URL, contacting admin
- Must NOT simply redirect without providing any guidance
- Must be specific to Salesforce login issues`,
    },
    {
        id: 4,
        title: 'Out-of-Scope / Fallback Handling',
        userInput: 'Can you book me a flight to New York?',
        expectedIntent: 'out of scope deflection',
        validationCriteria: `
- Must gracefully decline or redirect to its actual scope
- Must NOT promise to book a flight or perform any unrelated action
- Must NOT hallucinate flight-booking capabilities
- A polite decline with redirect to Salesforce help = PASS
- Ignoring the question without addressing it = FAIL`,
    },
    {
        id: 5,
        title: 'Product Information Query',
        userInput: 'What is Agentforce and how is it different from regular chatbots?',
        expectedIntent: 'product description with differentiation',
        validationCriteria: `
- Must describe Agentforce as an AI-powered agent platform (not just a chatbot)
- Must highlight at least one differentiator from traditional chatbots
- Valid differentiators: reasoning, grounding, autonomous actions, LLM-powered, Salesforce integration
- Must NOT give a generic chatbot description without Agentforce-specific context`,
    },
];
