import OpenAI from 'openai';
import { env } from '../config/env';
import { parseJSON } from '../utils/jsonUtils';

const client = new OpenAI({
  apiKey: env.groq.apiKey,
  baseURL: env.groq.apiUrl,
});

export async function chatCompletion(
  systemPrompt: string,
  userPrompt: string,
  options?: { temperature?: number; maxTokens?: number }
): Promise<string> {
  const response = await client.chat.completions.create({
    model: env.groq.deployment,
    temperature: options?.temperature ?? 0.7,
    max_tokens: options?.maxTokens ?? 1000,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error('Empty response from Groq');
  }

  return content.trim();
}

export async function chatCompletionJSON<T>(
  systemPrompt: string,
  userPrompt: string,
  options?: { temperature?: number; maxTokens?: number }
): Promise<T> {
  const raw = await chatCompletion(
    systemPrompt + '\n\nCRITICAL: Return ONLY a valid JSON object. No markdown, no backticks, no explanations. All string values must use escaped quotes if they contain quotes. The response must start with { and end with }.',
    userPrompt,
    {
      temperature: options?.temperature ?? 0.2,
      maxTokens: options?.maxTokens ?? 800,
    }
  );

  return parseJSON<T>(raw);
}
