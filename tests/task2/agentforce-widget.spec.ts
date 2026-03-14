import { expect } from '@playwright/test';
import { attachment, feature, step, story, suite } from 'allure-js-commons';
import fs from 'fs';
import { AGENTFORCE_SCENARIOS } from '../../src/constants/agentforceScenarios';
import { test } from '../../src/fixtures/testHooks';
import { agentConversationFlow } from '../../src/flows/agentConversationFlow';
import { AgentforceWidgetPage } from '../../src/pages/AgentforceWidgetPage';
import { saveTask2HTML, saveTask2JSON } from '../../src/services/reportService';
import { ScenarioResult } from '../../src/types/ai';
import { RUN_ID } from '../../src/utils/runId';
import { readRunData, writeRunData } from '../../src/utils/runStore';

test.describe('Task 2 — Agentforce Agent Interaction Testing', () => {
  for (const scenario of AGENTFORCE_SCENARIOS) {
    test(`Scenario ${scenario.id} · ${scenario.title}`, async ({ agentPage }) => {
      await suite('Task 2');
      await feature('Intent-Based AI Validation');
      await story(scenario.title);

      console.log(`[Task2][Scenario ${scenario.id}] ${scenario.title}`);

      const result = await step('Run conversation scenario', async () => {
        return agentConversationFlow(agentPage, scenario);
      });

      await step('Attach scenario artifacts', async () => {
        await attachment('Scenario Result', JSON.stringify(result, null, 2), {
          contentType: 'application/json',
        });

        await attachment(
          'AI Verdict',
          [
            `Verdict: ${result.passed ? 'PASS' : 'FAIL'}`,
            `Confidence: ${(result.aiVerdict.confidence * 100).toFixed(0)}%`,
            `Reasoning: ${result.aiVerdict.reasoning}`,
            `Key Evidence: ${result.aiVerdict.keyEvidence}`,
          ].join('\n'),
          { contentType: 'text/plain' }
        );

        if (
          result.agentResponse.screenshotPath &&
          fs.existsSync(result.agentResponse.screenshotPath)
        ) {
          await attachment(
            'Final Chat Screenshot',
            fs.readFileSync(result.agentResponse.screenshotPath),
            { contentType: 'image/png' }
          );
        }
      });

      console.log(`[Task2][Scenario ${scenario.id}] response=${result.agentResponse.rawText}`);
      console.log(
        `[Task2][Scenario ${scenario.id}] passed=${result.passed} confidence=${(
          result.aiVerdict.confidence * 100
        ).toFixed(0)}%`
      );
      console.log(`[Task2][Scenario ${scenario.id}] reasoning=${result.aiVerdict.reasoning}`);
      console.log(`[Task2][Scenario ${scenario.id}] evidence="${result.aiVerdict.keyEvidence}"`);

      await step('Persist scenario result', async () => {
        writeRunData(RUN_ID, `task2-scenario-${scenario.id}`, result);
      });

      await step('Reset widget state', async () => {
        const widgetPage = new AgentforceWidgetPage(agentPage);
        await widgetPage.closeAndReopen().catch(() => { });
      });

      await step('Validate scenario result', async () => {
        expect(
          result.agentResponse.rawText.length,
          `Scenario ${scenario.id}: Empty agent response`
        ).toBeGreaterThan(0);

        expect(
          result.passed,
          `Scenario ${scenario.id} FAILED\n` +
          `Intent: "${scenario.expectedIntent}"\n` +
          `Reasoning: ${result.aiVerdict.reasoning}`
        ).toBe(true);
      });
    });
  }

  test.afterAll(async () => {
    const allResults: ScenarioResult[] = AGENTFORCE_SCENARIOS
      .map((s) => readRunData<ScenarioResult>(RUN_ID, `task2-scenario-${s.id}`))
      .filter(Boolean) as ScenarioResult[];

    if (allResults.length < AGENTFORCE_SCENARIOS.length) {
      console.log(
        `[Task2] Partial results (${allResults.length}/${AGENTFORCE_SCENARIOS.length}) — skipping final report`
      );
      return;
    }

    saveTask2JSON(allResults, RUN_ID);
    saveTask2HTML(allResults, RUN_ID);

    const passed = allResults.filter((r) => r.passed).length;
    console.log(
      `[Task2] Final report saved | passed=${passed}/${allResults.length} | passRate=${(
        (passed / allResults.length) *
        100
      ).toFixed(0)}%`
    );
  });
});