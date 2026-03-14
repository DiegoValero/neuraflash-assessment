import { Page } from '@playwright/test';
import { LeadsListPage } from '../pages/LeadsListPage';
import { SalesforceHomePage } from '../pages/SalesforceHomePage';
import { generateLeadsSummary } from '../services/aiSummaryService';
import { LeadsExtractionResult } from '../types/lead';
import { nowISO } from '../utils/dateUtils';

export async function extractLeadsFlow(page: Page): Promise<{
  extraction: LeadsExtractionResult;
  aiSummary: string;
}> {
  const homePage = new SalesforceHomePage(page);
  await homePage.openSalesApp();
  await homePage.navigateToLeads();

  const listPage = new LeadsListPage(page);
  await listPage.waitForList();
  const leads = await listPage.fetchAll();

  const byStatus = listPage.groupByStatus(leads);

  const extraction: LeadsExtractionResult = {
    leads,
    totalCount: leads.length,
    byStatus,
    timestamp: nowISO(),
  };

  const aiSummary = await generateLeadsSummary(extraction.totalCount, extraction.byStatus);

  return { extraction, aiSummary };
}