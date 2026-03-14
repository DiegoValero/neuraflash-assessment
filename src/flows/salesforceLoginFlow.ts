import { Page } from '@playwright/test';
import { SalesforceLoginPage } from '../pages/SalesforceLoginPage';

export async function salesforceLoginFlow(page: Page): Promise<void> {
  const loginPage = new SalesforceLoginPage(page);
  await loginPage.login();
}
