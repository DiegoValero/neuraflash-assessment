import { Locator, Page } from '@playwright/test';
import { LeadRecord, LeadStatus, LeadStatusCount } from '../types/lead';
import { clickWhenReady, safeInnerText } from '../utils/locatorUtils';
import { BasePage } from './BasePage';

export class LeadsListPage extends BasePage {
  private readonly tableRows: Locator;
  private readonly allLeadsView: Locator;
  private readonly listViewCtrl: Locator;

  constructor(page: Page) {
    super(page);
    this.tableRows = this.page.locator('tr[data-row-key-value]:not([data-row-key-value="HEADER"])');
    this.listViewCtrl = this.page.getByRole('button', { name: 'Select a List View: Leads' });
    this.allLeadsView = this.page.locator('lightning-base-combobox-item[data-value="All_Leads"]');
  }

  async waitForList(): Promise<void> {
    await this.tableRows.first().waitFor({ state: 'visible', timeout: 20_000 });
    console.log('[LeadsListPage] Leads list loaded');
  }

  async navigateDirect(): Promise<void> {
    const url = `${this.getSFBaseUrl()}/lightning/o/Lead/list`;
    await this.page.goto(url, { waitUntil: 'domcontentloaded' });
    await this.tableRows.first().waitFor({ state: 'visible', timeout: 20_000 });
    console.log('[LeadsListPage] Leads list loaded (direct)');
  }

  async trySelectAllLeadsView(): Promise<void> {
    try {
      if (await this.listViewCtrl.isVisible({ timeout: 2_000 })) {
        await clickWhenReady(this.listViewCtrl);

        if (await this.allLeadsView.isVisible({ timeout: 2_000 })) {
          await clickWhenReady(this.allLeadsView);
          await this.waitForReady();
          await this.tableRows.first().waitFor({ state: 'visible', timeout: 10_000 });
        }
      }
    } catch { }
  }

  private async extractCurrentPage(): Promise<LeadRecord[]> {
    const all: LeadRecord[] = [];

    let totalRows = await this.tableRows.count();
    console.log(`[LeadsListPage] Initial rows: ${totalRows}`);

    let i = 0;
    while (i < totalRows) {
      await this.tableRows.nth(i).scrollIntoViewIfNeeded();
      await this.page.waitForTimeout(200);

      const newCount = await this.tableRows.count();
      if (newCount > totalRows) {
        console.log(`[LeadsListPage] New rows rendered: ${newCount}`);
        totalRows = newCount;
      }

      i++;
    }

    console.log(`[LeadsListPage] Final row count: ${totalRows}`);

    for (let j = 0; j < totalRows; j++) {
      const row = this.tableRows.nth(j);
      const cells = row.locator('td');
      const cnt = await cells.count();

      const fullName = (
        await safeInnerText(row.locator('td').nth(1).locator('a, span').first())
      ).trim();

      if (!fullName) continue;

      let status: LeadStatus | null = null;

      for (let k = 0; k < cnt; k++) {
        const txt = await safeInnerText(cells.nth(k));
        if (/Not Contacted|Working|Converted|Closed/i.test(txt)) {
          status = normalizeLeadStatus(txt);
          break;
        }
      }

      if (!status) {
        throw new Error(`Could not determine Lead Status for row: "${fullName}"`);
      }

      const parts = fullName.split(' ');

      all.push({
        firstName: parts[0] ?? '',
        lastName: parts.slice(1).join(' '),
        fullName,
        company: '',
        email: '',
        phone: '',
        status,
      });
    }

    console.log(`[LeadsListPage] Extracted ${all.length} records`);
    return all;
  }

  async fetchAll(): Promise<LeadRecord[]> {
    await this.trySelectAllLeadsView();

    const records = await this.extractCurrentPage();
    console.log(`[LeadsListPage] Extraction complete. Total: ${records.length}`);

    return records;
  }

  groupByStatus(leads: LeadRecord[]): LeadStatusCount[] {
    const map = new Map<string, number>();

    for (const lead of leads) {
      map.set(lead.status, (map.get(lead.status) ?? 0) + 1);
    }

    const total = leads.length;

    return Array.from(map.entries())
      .map(([status, count]) => ({
        status,
        count,
        percentage: total ? (count / total) * 100 : 0,
      }))
      .sort((a, b) => b.count - a.count);
  }
}

function normalizeLeadStatus(value: string): LeadStatus {
  const text = value.trim().toLowerCase();

  if (text.includes('open - not contacted')) return 'Open - Not Contacted';
  if (text.includes('working - contacted')) return 'Working - Contacted';
  if (text.includes('closed - converted')) return 'Closed - Converted';
  if (text.includes('closed - not converted')) return 'Closed - Not Converted';

  throw new Error(`Unsupported Lead Status: "${value}"`);
}