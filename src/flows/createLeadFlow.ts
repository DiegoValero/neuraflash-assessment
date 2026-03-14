import { Page } from '@playwright/test';
import { LeadFormPage } from '../pages/LeadFormPage';
import { SalesforceHomePage } from '../pages/SalesforceHomePage';
import { evaluateLeadCreation } from '../services/aiAssertionService';
import { generateLeadData } from '../services/aiLeadService';
import { LeadCreationResult } from '../types/lead';
import { nowISO } from '../utils/dateUtils';

export async function createLeadFlow(page: Page): Promise<LeadCreationResult> {
  const leadData = await generateLeadData();

  const homePage = new SalesforceHomePage(page);
  await homePage.openSalesApp();
  await homePage.navigateToLeads();

  const formPage = new LeadFormPage(page);
  await formPage.clickNew();
  await formPage.fillLeadForm(leadData);
  await formPage.save();

  const toastMessage = await formPage.getToastMessage();
  await formPage.waitForDetailPage();
  const recordName = await formPage.getRecordName();
  const currentUrl = page.url();
  const pageTitle = await page.title();
  const screenshotPath = await formPage.takeScreenshot(`lead_created_${leadData.lastName}`);

  const aiAssertion = await evaluateLeadCreation({
    expectedName: `${leadData.firstName} ${leadData.lastName}`,
    pageTitle,
    currentUrl,
    toastMessage,
    visibleText: `${toastMessage} ${recordName} ${currentUrl}`,
  });

  return {
    success: aiAssertion.passed,
    leadData,
    recordName,
    toastMessage,
    screenshotPath,
    timestamp: nowISO(),
    aiAssertion,
  };
}