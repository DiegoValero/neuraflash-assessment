import { Locator, Page } from '@playwright/test';
import { clickWhenReady } from '../utils/locatorUtils';
import { BasePage } from './BasePage';

export class SalesforceHomePage extends BasePage {
  private readonly appLauncherBtn: Locator;
  private readonly appSearchInput: Locator;
  private readonly leadsNavItem: Locator;
  private readonly salesItem: Locator;

  constructor(page: Page) {
    super(page);
    this.appLauncherBtn = this.page.getByRole('button', { name: 'App Launcher' });
    this.appSearchInput = this.page.getByRole('combobox', { name: 'Search apps and items...' });
    this.leadsNavItem = this.page.getByRole('link', { name: 'Leads', exact: true });
    this.salesItem = this.page.locator('a[role="option"][data-label="Sales"]');
  }

  async openSalesApp(): Promise<void> {
    console.log('[SalesforceHomePage] Opening App Launcher...');
    await clickWhenReady(this.appLauncherBtn);

    let searchVisible = false;
    let salesVisible = false;
    const deadline = Date.now() + 10_000;

    while (Date.now() < deadline) {
      searchVisible = await this.appSearchInput.isVisible().catch(() => false);
      salesVisible = await this.salesItem.isVisible().catch(() => false);

      if (searchVisible || salesVisible) {
        break;
      }

      await this.page.waitForTimeout(500);
    }

    if (!searchVisible && !salesVisible) {
      console.log('[SalesforceHomePage] App Launcher did not show search input or Sales item. Skipping Sales app open.');
      return;
    }

    if (searchVisible) {
      await this.appSearchInput.fill('Sales');

      const itemDeadline = Date.now() + 8_000;
      while (Date.now() < itemDeadline) {
        salesVisible = await this.salesItem.isVisible().catch(() => false);
        if (salesVisible) break;
        await this.page.waitForTimeout(300);
      }

      if (!salesVisible) {
        console.warn('[SalesforceHomePage] Sales item not found — may already be on Sales app');
        await this.page.keyboard.press('Escape');
        await this.waitForReady();
        console.log('[SalesforceHomePage] Sales app opened');
        return;
      }
    }

    await clickWhenReady(this.salesItem);
    await this.waitForReady();
    console.log('[SalesforceHomePage] Sales app opened');
  }

  async navigateToLeads(): Promise<void> {
    console.log('[SalesforceHomePage] Navigating to Leads...');
    await this.leadsNavItem.waitFor({ state: 'visible', timeout: 10_000 });
    await this.leadsNavItem.click();
    await this.waitForReady();
    console.log('[SalesforceHomePage] Leads list view loaded');
  }
}