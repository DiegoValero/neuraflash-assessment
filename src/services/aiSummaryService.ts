import { PROMPTS } from '../constants/prompts';
import { LeadStatusCount } from '../types/lead';
import { chatCompletion } from './OpenAIClient';

export async function generateLeadsSummary(
  totalLeads: number,
  byStatus: LeadStatusCount[]
): Promise<string> {
  const statusLines = byStatus
    .map((s) => `  - ${s.status}: ${s.count} leads (${s.percentage.toFixed(1)}%)`)
    .join('\n');

  const summary = await chatCompletion(
    PROMPTS.SUMMARIZER.system,
    PROMPTS.SUMMARIZER.user(totalLeads, statusLines),
    { temperature: 0.5, maxTokens: 200 }
  );

  console.log(`[aiSummaryService] Summary generated (${summary.length} chars)`);
  return summary;
}