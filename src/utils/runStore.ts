import fs from 'fs';
import path from 'path';

const STORE_DIR = path.join('reports', '.run-store');

// Saves data for the current run using a key-based file name.
export function writeRunData(runId: string, key: string, data: unknown): void {
  if (!fs.existsSync(STORE_DIR)) {
    fs.mkdirSync(STORE_DIR, { recursive: true });
  }

  const filePath = path.join(STORE_DIR, `${runId}.${key}.json`);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

// Reads previously saved data for the current run.
export function readRunData<T>(runId: string, key: string): T | null {
  const filePath = path.join(STORE_DIR, `${runId}.${key}.json`);

  if (!fs.existsSync(filePath)) {
    return null;
  }

  return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as T;
}

// Removes stored data for the current run and key.
export function cleanRunData(runId: string, key: string): void {
  const filePath = path.join(STORE_DIR, `${runId}.${key}.json`);

  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}