import { Page } from '@playwright/test';
import { AgentforceWidgetPage } from '../pages/AgentforceWidgetPage';
import { evaluateAgentResponse } from '../services/aiAgentEvaluatorService';
import { AgentScenario, ScenarioResult } from '../types/ai';
import { nowISO } from '../utils/dateUtils';

export async function agentConversationFlow(
  page: Page,
  scenario: AgentScenario,
): Promise<ScenarioResult> {
  const widgetPage = new AgentforceWidgetPage(page);

  const agentResponse = await widgetPage.runScenario(scenario.userInput);

  const aiVerdict = await evaluateAgentResponse({
    userInput: scenario.userInput,
    agentResponse: agentResponse.rawText,
    expectedIntent: scenario.expectedIntent,
    validationCriteria: scenario.validationCriteria,
    responseTimeMs: agentResponse.responseTimeMs,
  });

  return {
    scenario,
    agentResponse,
    aiVerdict,
    passed: aiVerdict.passed,
    timestamp: nowISO(),
  };
}
