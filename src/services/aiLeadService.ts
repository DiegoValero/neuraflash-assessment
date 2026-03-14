import { env } from '../config/env';
import { PROMPTS } from '../constants/prompts';
import { LeadData, LeadStatus } from '../types/lead';
import { chatCompletionJSON } from './OpenAIClient';

const LEAD_STATUSES: LeadStatus[] = [
  'Open - Not Contacted',
  'Working - Contacted',
  'Closed - Converted',
  'Closed - Not Converted',
];

function randomStatus(): LeadStatus {
  return LEAD_STATUSES[Math.floor(Math.random() * LEAD_STATUSES.length)];
}

export async function generateLeadData(): Promise<LeadData> {
  const status = randomStatus();

  const lead = await chatCompletionJSON<LeadData>(
    PROMPTS.DATA_GENERATOR.system,
    PROMPTS.DATA_GENERATOR.user(status),
    { temperature: env.test.aiTemperature }
  );

  if (!LEAD_STATUSES.includes(lead.status)) {
    lead.status = status;
  }

  console.log(
    `[aiLeadService] Generated ${lead.firstName} ${lead.lastName} | ${lead.company} | ${lead.status}`
  );

  return lead;
}