import dotenv from 'dotenv';
dotenv.config();

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required environment variable: ${key}`);
  return value;
}

export const env = {
  salesforce: {
    username: requireEnv('SF_USERNAME'),
    password: requireEnv('SF_PASSWORD'),
    loginUrl: process.env.SF_LOGIN_URL ?? 'https://login.salesforce.com',
  },
  groq: {
    apiKey: requireEnv('GROQ_API_KEY'),
    deployment: process.env.GROQ_DEPLOYMENT ?? 'llama-3.3-70b-versatile',
    apiUrl: process.env.GROQ_URL ?? 'https://api.groq.com/openai/v1'
  },
  test: {
    headless: process.env.HEADLESS !== 'false',
    confidenceThreshold: parseFloat(process.env.AI_CONFIDENCE_THRESHOLD ?? '0.75'),
    aiTemperature: parseFloat(process.env.AI_TEMPETURE ?? '0.85'),
  },
  agentforce: {
    loginUrl: process.env.AF_LOGIN_URL ?? 'https://help.salesforce.com/s/'
  }
} as const;
