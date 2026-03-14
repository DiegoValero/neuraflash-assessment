import { Locator, Page } from '@playwright/test';
import { LeadData } from '../types/lead';
import { clickWhenReady, fillWhenReady } from '../utils/locatorUtils';
import { BasePage } from './BasePage';

export class LeadFormPage extends BasePage {
  private readonly newBtn: Locator;
  private readonly firstNameInput: Locator;
  private readonly lastNameInput: Locator;
  private readonly companyInput: Locator;
  private readonly emailInput: Locator;
  private readonly phoneInput: Locator;
  private readonly statusCombobox: Locator;
  private readonly saveBtn: Locator;
  private readonly successToast: Locator;

  constructor(page: Page) {
    super(page);
    this.newBtn = this.page.getByRole('button', { name: 'New' });
    this.firstNameInput = this.page.locator('input[name="firstName"]');
    this.lastNameInput = this.page.locator('input[name="lastName"]');
    this.companyInput = this.page.locator('input[name="Company"]');
    this.emailInput = this.page.locator('input[name="Email"]');
    this.phoneInput = this.page.locator('input[name="Phone"]');
    this.statusCombobox = this.page.getByRole('combobox', { name: 'Lead Status' });
    this.saveBtn = this.page.locator('button[name="SaveEdit"]');
    this.successToast = this.page.locator('.toastMessage');
  }

  async clickNew(): Promise<void> {
    await clickWhenReady(this.newBtn);
    await this.lastNameInput.waitFor({ state: 'visible', timeout: 15_000 });
    console.log('[LeadFormPage] New Lead form ready');
  }

  async fillLeadForm(lead: LeadData): Promise<void> {
    console.log(`[LeadFormPage] Filling form → ${lead.firstName} ${lead.lastName}`);
    await fillWhenReady(this.firstNameInput, lead.firstName);
    await fillWhenReady(this.lastNameInput, lead.lastName);
    await fillWhenReady(this.companyInput, lead.company);
    await fillWhenReady(this.emailInput, lead.email);
    await fillWhenReady(this.phoneInput, lead.phone);
    await this.selectStatus(lead.status);
  }

  private async selectStatus(status: string): Promise<void> {
    await clickWhenReady(this.statusCombobox);

    const option = this.page
      .getByRole('option', { name: status })
      .or(this.page.locator(`lightning-base-combobox-item span[title="${status}"]`))
      .first();

    await option.waitFor({ state: 'visible', timeout: 5_000 });
    await option.click();
    console.log(`[LeadFormPage] Status selected: ${status}`);
  }

  async save(): Promise<void> {
    await clickWhenReady(this.saveBtn);
    console.log('[LeadFormPage] Save clicked');
  }

  async getToastMessage(): Promise<string> {
    try {
      await this.successToast.waitFor({ state: 'visible', timeout: 12_000 });
      return (await this.successToast.innerText()).trim();
    } catch {
      return '';
    }
  }

  async waitForDetailPage(): Promise<void> {
    await this.page.waitForURL(/\/lightning\/r\/(Lead\/)?[a-zA-Z0-9]+\/view/, {
      timeout: 30_000,
    });

    await this.waitForReady();
    console.log(`[LeadFormPage] Record detail page loaded → ${this.page.url()}`);
  }

  async getRecordName(): Promise<string> {
    const nameLocator = this.page
      .locator('.highlights-region h1 span')
      .or(this.page.locator('lightning-formatted-name'))
      .first();

    await nameLocator.waitFor({ state: 'visible', timeout: 15_000 });
    return nameLocator.innerText();
  }
}