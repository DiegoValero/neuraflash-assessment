import { Locator, Page } from '@playwright/test';

// Returns the first selector that is visible on the page.
export async function firstVisible(page: Page, selectors: string[]): Promise<Locator | null> {
  for (const selector of selectors) {
    try {
      const locator = page.locator(selector).first();
      if (await locator.isVisible({ timeout: 2_000 })) {
        return locator;
      }
    } catch { }
  }

  return null;
}

// Waits for a field to be visible before filling it.
export async function fillWhenReady(locator: Locator, value: string): Promise<void> {
  await locator.waitFor({ state: 'visible' });
  await locator.clear();
  await locator.fill(value);
}

// Waits for an element to be visible before clicking it.
export async function clickWhenReady(locator: Locator): Promise<void> {
  await locator.waitFor({ state: 'visible' });
  await locator.click();
}

// Returns the element text or an empty string if it cannot be read.
export async function safeInnerText(locator: Locator): Promise<string> {
  try {
    return (await locator.innerText()).trim();
  } catch {
    return '';
  }
}