export interface AIAssertionResult {
  passed: boolean;
  confidence: number;
  reasoning: string;
  keyEvidence: string;
  performanceNote?: string;
}

export interface AgentScenario {
  id: number;
  title: string;
  userInput: string;
  expectedIntent: string;
  validationCriteria: string;
}

export interface AgentResponse {
  rawText: string;
  usefulLinks: string[];
  responseTimeMs: number;
  screenshotPath: string;
}

export interface ScenarioResult {
  scenario: AgentScenario;
  agentResponse: AgentResponse;
  aiVerdict: AIAssertionResult;
  passed: boolean;
  timestamp: string;
}