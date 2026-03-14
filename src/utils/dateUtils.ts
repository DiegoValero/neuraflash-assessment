// Returns the current timestamp in ISO format.
export function nowISO(): string {
  return new Date().toISOString();
}

// Creates a timestamp that is safe to use in file names.
export function nowSlug(): string {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

// Formats milliseconds into a short readable duration.
export function formatDuration(ms: number): string {
  if (ms < 1000) {
    return `${ms}ms`;
  }

  return `${(ms / 1000).toFixed(1)}s`;
}