import fs from 'fs';
import path from 'path';

// Creates the directory if it does not exist.
export function ensureDir(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

// Writes text content to a file, creating parent folders if needed.
export function writeFile(filePath: string, content: string): void {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, content, 'utf-8');
}

// Reads a file as UTF-8 text.
export function readFile(filePath: string): string {
  return fs.readFileSync(filePath, 'utf-8');
}

// Checks whether a file exists.
export function fileExists(filePath: string): boolean {
  return fs.existsSync(filePath);
}