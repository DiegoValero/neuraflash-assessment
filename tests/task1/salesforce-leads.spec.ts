import { expect } from '@playwright/test';
import { attachment, feature, step, story, suite } from 'allure-js-commons';
import { test } from '../../src/fixtures/testHooks';
import { createLeadFlow } from '../../src/flows/createLeadFlow';
import { extractLeadsFlow } from '../../src/flows/extractLeadsFlow';
import { saveTask1HTML, saveTask1JSON } from '../../src/services/reportService';
import { LeadCreationResult } from '../../src/types/lead';
import { nowISO } from '../../src/utils/dateUtils';
import { RUN_ID } from '../../src/utils/runId';
import { readRunData, writeRunData } from '../../src/utils/runStore';

test.describe('Task 1 — Salesforce Lead Automation', () => {
  test('1A · Create Lead with AI-generated data and validate creation', async ({ sfPage }) => {
    await suite('Task 1');
    await feature('Lead Creation');
    await story('AI Data Generation + UI Automation + AI Assertion');

    const result = await step('Create a lead and collect evidence', async () => {
      return createLeadFlow(sfPage);
    });

    await step('Attach creation artifacts', async () => {
      await attachment('Lead Creation Result', JSON.stringify(result, null, 2), {
        contentType: 'application/json',
      });

      const screenshot = await sfPage.screenshot();
      await attachment('Lead Detail Screenshot', screenshot, { contentType: 'image/png' });

      await attachment(
        'AI Assertion Reasoning',
        [
          `Verdict: ${result.success ? 'PASS' : 'FAIL'}`,
          `Confidence: ${((result.aiAssertion?.confidence ?? 0) * 100).toFixed(0)}%`,
          `Reasoning: ${result.aiAssertion?.reasoning ?? 'N/A'}`,
          `Key Evidence: ${Array.isArray(result.aiAssertion?.keyEvidence)
            ? result.aiAssertion.keyEvidence.join(' | ')
            : result.aiAssertion?.keyEvidence ?? 'N/A'
          }`,
        ].join('\n'),
        { contentType: 'text/plain' }
      );
    });

    await step('Persist lead creation result for reporting', async () => {
      writeRunData(RUN_ID, 'task1Creation', result);
    });

    await step('Validate lead creation result', async () => {
      expect(result.leadData.lastName).toBeTruthy();
      expect(result.recordName.toLowerCase()).toContain(result.leadData.lastName.toLowerCase());
      expect(sfPage.url()).toContain('/lightning/r/');
      expect(sfPage.url()).toContain('/view');
      expect(result.success, `AI assertion failed for lead: ${result.recordName}`).toBe(true);
    });

    console.log(`[Task1][1A] Lead created: ${result.recordName}`);
  });

  test('1B · Fetch all Leads, group by status, generate AI report', async ({ sfPage }) => {
    await suite('Task 1');
    await feature('Leads Reporting');
    await story('Status Grouping and Summary');

    const { extraction, aiSummary } = await step('Extract leads and generate summary', async () => {
      return extractLeadsFlow(sfPage);
    });

    await step('Attach extraction artifacts', async () => {
      await attachment('Leads Extraction', JSON.stringify(extraction, null, 2), {
        contentType: 'application/json',
      });

      await attachment('AI Summary', aiSummary, { contentType: 'text/plain' });

      const screenshot = await sfPage.screenshot();
      await attachment('Leads List Screenshot', screenshot, { contentType: 'image/png' });
    });

    await step('Validate extraction result', async () => {
      expect(extraction.totalCount).toBeGreaterThan(0);
      expect(extraction.byStatus.length).toBeGreaterThan(0);
      expect(aiSummary.length).toBeGreaterThan(20);
    });

    const creation = await step('Load lead creation result from run store', async () => {
      return (
        readRunData<LeadCreationResult>(RUN_ID, 'task1Creation') ?? {
          success: false,
          leadData: {
            firstName: 'N/A',
            lastName: 'N/A',
            company: 'N/A',
            email: 'N/A',
            phone: 'N/A',
            status: 'N/A',
          },
          recordName: 'N/A',
          toastMessage: '',
          screenshotPath: '',
          timestamp: nowISO(),
          aiAssertion: {
            passed: false,
            confidence: 0,
            reasoning: '1A was not executed in this run.',
            keyEvidence: '',
          },
        }
      );
    });

    const task1Report = await step('Build final Task 1 report', async () => {
      return {
        leadCreation: creation,
        leadsExtraction: extraction,
        aiSummary,
        aiAssertionResult: {
          passed: creation.aiAssertion?.passed ?? creation.success ?? false,
          confidence: creation.aiAssertion?.confidence ?? 0,
          reasoning: creation.aiAssertion?.reasoning ?? 'No AI assertion reasoning available from 1A.',
          keyEvidence: Array.isArray(creation.aiAssertion?.keyEvidence)
            ? creation.aiAssertion.keyEvidence.join(' | ')
            : creation.aiAssertion?.keyEvidence ?? '',
        },
        generatedAt: nowISO(),
        isPartial: false,
        completedSteps: creation.recordName !== 'N/A' ? ['1A', '1B'] : ['1B'],
      };
    });

    await step('Save Task 1 reports', async () => {
      saveTask1JSON(task1Report, RUN_ID);
      saveTask1HTML(task1Report, RUN_ID);
    });

    console.log(`[Task1][1B] Total Leads: ${extraction.totalCount} | Groups: ${extraction.byStatus.length}`);
    console.log(`[Task1][1B] Summary: ${aiSummary}`);
    extraction.byStatus.forEach((s) => {
      console.log(`[Task1][1B] ${s.status}: ${s.count} (${s.percentage.toFixed(1)}%)`);
    });
  });
});