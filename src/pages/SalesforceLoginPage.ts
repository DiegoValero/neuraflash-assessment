import { Page } from '@playwright/test';
import { env } from '../config/env';
import { clickWhenReady, fillWhenReady } from '../utils/locatorUtils';
import { BasePage } from './BasePage';

export class SalesforceLoginPage extends BasePage {
  private readonly username = this.page.locator('#username');
  private readonly password = this.page.locator('#password');
  private readonly loginBtn = this.page.locator('#Login');
  private readonly errorMsg = this.page.locator('#error');

  constructor(page: Page) {
    super(page);
  }

  async navigate(): Promise<void> {
    await this.page.goto(env.salesforce.loginUrl, { waitUntil: 'domcontentloaded' });
  }

  async login(
    username = env.salesforce.username,
    password = env.salesforce.password
  ): Promise<void> {
    console.log('[SalesforceLoginPage] Logging in');

    await this.navigate();
    await fillWhenReady(this.username, username);
    await fillWhenReady(this.password, password);
    await clickWhenReady(this.loginBtn);

    await this.page.waitForURL(
      (url) => !url.href.includes('login.salesforce.com'),
      { timeout: 30_000 }
    );

    const hasError = await this.errorMsg.isVisible().catch(() => false);
    if (hasError) {
      const msg = await this.errorMsg.innerText();
      throw new Error(`Salesforce login failed: ${msg}`);
    }

    await this.waitForReady();
    console.log(`[SalesforceLoginPage] Login successful → ${this.page.url()}`);
  }
}