import { test as base, Browser, BrowserContext } from '@playwright/test';
import fs from 'fs';
import { SF_AUTH_FILE } from '../auth/salesforceAuth';
import { AgentforceWidgetPage } from '../pages/AgentforceWidgetPage';
import { env } from '../config/env';

async function contextWithAuth(
  browser: Browser,
  authFile: string
): Promise<BrowserContext> {
  if (fs.existsSync(authFile)) {
    return browser.newContext({ storageState: authFile });
  }
  console.warn(`\nAuth file not found: ${authFile}\n`);
  return browser.newContext();
}

export const test = base.extend<{
  sfPage:    typeof base.prototype['page'];
  agentPage: typeof base.prototype['page'];
}>({
  sfPage: async ({ browser }, use) => {
    const context = await contextWithAuth(browser, SF_AUTH_FILE);
    const page    = await context.newPage();

    await page.goto(`${env.salesforce.loginUrl}/lightning/page/home`, {
      waitUntil: 'domcontentloaded',
      timeout:   30_000,
    });

    if (page.url().includes('login.salesforce.com')) {
      console.warn('\nSession invalid — run: npm run auth:sf:force\n');
    }

    await use(page);
    await context.close();
  },

  agentPage: async ({ browser }, use) => {
    const context    = await browser.newContext();
    const page       = await context.newPage();
    const widgetPage = new AgentforceWidgetPage(page);

    await widgetPage.navigateToHelpPortal();
    await widgetPage.openWidget();

    await use(page);
    await context.close();
  },
});

export { expect } from '@playwright/test';