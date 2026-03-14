import { PROMPTS } from '../constants/prompts';
import { AIAssertionResult } from '../types/ai';
import { chatCompletionJSON } from './OpenAIClient';

export async function evaluateLeadCreation(evidence: {
  expectedName: string;
  pageTitle: string;
  currentUrl: string;
  toastMessage: string;
  visibleText: string;
}): Promise<AIAssertionResult> {
  const result = await chatCompletionJSON<AIAssertionResult>(
    PROMPTS.ASSERTION_REASONER.system,
    PROMPTS.ASSERTION_REASONER.user(
      evidence.expectedName,
      evidence.pageTitle,
      evidence.currentUrl,
      evidence.toastMessage,
      evidence.visibleText
    ),
    { temperature: 0.1 }
  );

  console.log(`[aiAssertionService] passed=${result.passed} confidence=${(result.confidence * 100).toFixed(0)}%`);
  console.log(`[aiAssertionService] reasoning=${result.reasoning}`);
  console.log(`[aiAssertionService] keyEvidence=${result.keyEvidence}`);

  return result;
}