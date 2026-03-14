import { env } from '../config/env';
import { PROMPTS } from '../constants/prompts';
import { AIAssertionResult } from '../types/ai';
import { chatCompletionJSON } from './OpenAIClient';

export async function evaluateAgentResponse(input: {
  userInput: string;
  agentResponse: string;
  expectedIntent: string;
  validationCriteria: string;
  responseTimeMs: number;
}): Promise<AIAssertionResult> {
  const verdict = await chatCompletionJSON<AIAssertionResult>(
    PROMPTS.AGENT_EVALUATOR.system,
    PROMPTS.AGENT_EVALUATOR.user(
      input.userInput,
      input.agentResponse,
      input.expectedIntent,
      input.validationCriteria,
      input.responseTimeMs
    ),
    { temperature: 0.1, maxTokens: 600 }
  );

  const threshold = env.test.confidenceThreshold;
  const meetsThreshold = verdict.confidence >= threshold;

  if (verdict.passed && !meetsThreshold) {
    console.warn(
      `[aiAgentEvaluatorService] Confidence ${(verdict.confidence * 100).toFixed(0)}% ` +
      `< threshold ${(threshold * 100).toFixed(0)}% — overriding to FAIL`
    );
    verdict.passed = false;
  }

  console.log(
    `[aiAgentEvaluatorService] Verdict: ${verdict.passed ? 'PASS' : 'FAIL'} | ` +
    `Confidence: ${(verdict.confidence * 100).toFixed(0)}% | ` +
    `Time: ${input.responseTimeMs}ms`
  );

  return verdict;
}