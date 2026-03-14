import { Page } from '@playwright/test';
import path from 'path';
import { nowSlug } from '../utils/dateUtils';
import { ensureDir } from '../utils/fileUtils';

export abstract class BasePage {
  constructor(protected readonly page: Page) { }

  async waitForReady(): Promise<void> {
    await this.page.waitForLoadState('domcontentloaded');
    await this.page.waitForTimeout(1_500);
  }

  async takeScreenshot(name: string): Promise<string> {
    const safe = name.replace(/[^a-z0-9_-]/gi, '_').toLowerCase();
    const dir = path.join('reports', 'screenshots');
    ensureDir(dir);

    const filePath = path.join(dir, `${safe}_${nowSlug()}.png`);
    await this.page.screenshot({ path: filePath, fullPage: false });
    console.log(`[Screenshot] → ${filePath}`);

    return filePath;
  }

  async getPageTitle(): Promise<string> {
    return this.page.title();
  }

  async getCurrentUrl(): Promise<string> {
    return this.page.url();
  }

  async getBodyText(): Promise<string> {
    return this.page.locator('body').innerText();
  }

  protected getSFBaseUrl(): string {
    const match = this.page.url().match(/https:\/\/[^/]+/);
    if (!match) {
      throw new Error('Could not determine Salesforce base URL');
    }

    return match[0];
  }
}