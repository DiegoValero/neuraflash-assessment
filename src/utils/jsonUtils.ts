import path from 'path';
import { nowSlug } from './dateUtils';
import { writeFile } from './fileUtils';

// Converts a value into pretty-printed JSON.
export function toJSON(data: unknown): string {
  return JSON.stringify(data, null, 2);
}

// Saves JSON content to the reports/json folder.
export function saveJSON(filename: string, data: unknown): string {
  const filePath = path.join('reports', 'json', filename);
  writeFile(filePath, toJSON(data));
  console.log(`[JSON] Saved → ${filePath}`);
  return filePath;
}

// Saves JSON content with a timestamped file name.
export function saveJSONTimestamped(filename: string, data: unknown): string {
  const base = filename.replace('.json', '');
  const slug = nowSlug();
  const newName = `${base}_${slug}.json`;
  const filePath = path.join('reports', 'json', newName);

  writeFile(filePath, toJSON(data));
  console.log(`[JSON] Saved → ${filePath}`);

  return filePath;
}

// Tries to parse a JSON object from a raw model response.
export function parseJSON<T>(raw: string): T {
  let cleaned = raw.replace(/```json\n?|```/g, '').trim();

  const start = cleaned.indexOf('{');
  const end   = cleaned.lastIndexOf('}');
  if (start !== -1 && end !== -1) {
    cleaned = cleaned.slice(start, end + 1);
  }

  // Attempt 1 — direct parse
  try {
    return JSON.parse(cleaned) as T;
  } catch { /* continue */ }

  // Attempt 2 — replace newlines and control chars inside string values
  try {
    const normalized = cleaned
      .replace(/[\r\n\t]/g, ' ')
      .replace(/\s{2,}/g, ' ');
    return JSON.parse(normalized) as T;
  } catch { /* continue */ }

  // Attempt 3 — extract fields manually, no regex replacement of quotes
  try {
    const getBool = (field: string): boolean => {
      const m = cleaned.match(new RegExp(`"${field}"\\s*:\\s*(true|false)`, 'i'));
      return m ? m[1] === 'true' : false;
    };
    const getNum = (field: string): number => {
      const m = cleaned.match(new RegExp(`"${field}"\\s*:\\s*([0-9.]+)`, 'i'));
      return m ? parseFloat(m[1]) : 0;
    };
    const getStr = (field: string): string => {
      const m = cleaned.match(new RegExp(`"${field}"\\s*:\\s*"([\\s\\S]*?)"\\s*[,}]`, 'i'));
      return m ? m[1].replace(/\\'/g, "'") : '';
    };

    return {
      passed:      getBool('passed'),
      confidence:  getNum('confidence'),
      reasoning:   getStr('reasoning'),
      keyEvidence: getStr('keyEvidence') || getStr('keyevidence'),
      // LeadData fields
      firstName:   getStr('firstName'),
      lastName:    getStr('lastName'),
      company:     getStr('company'),
      email:       getStr('email'),
      phone:       getStr('phone'),
      status:      getStr('status'),
    } as T;
  } catch (err) {
    throw new Error(`parseJSON failed after all attempts.\nRaw (200 chars): ${raw.substring(0, 200)}`);
  }
}