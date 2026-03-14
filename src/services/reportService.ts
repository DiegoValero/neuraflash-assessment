import path from 'path';
import { ScenarioResult } from '../types/ai';
import { nowISO } from '../utils/dateUtils';
import { writeFile } from '../utils/fileUtils';
import { saveJSONTimestamped } from '../utils/jsonUtils';

const REPORTS_HTML_DIR = path.join('reports', 'html');

export function saveTask1JSON(report: any, runId: string): void {
  saveJSONTimestamped(`task1-report.${runId}`, report);
}

export function saveTask1HTML(report: any, runId: string): void {
  const html = buildTask1HTML(report);
  const filePath = path.join(REPORTS_HTML_DIR, `task1-report.${runId}.html`);
  writeFile(filePath, html);
  console.log(`[reportService] HTML saved → ${filePath}`);
}

function buildTask1HTML(report: any): string {
  const { leadCreation, leadsExtraction, aiSummary, aiAssertionResult } = report;

  const byStatus = leadsExtraction?.byStatus ?? [];
  const totalCount = leadsExtraction?.totalCount ?? 0;
  const isPartial = report.isPartial === true;
  const completedSteps = report.completedSteps ?? [];

  const statusRows = byStatus.length
    ? byStatus.map((s: any) => `
      <tr>
        <td>${escapeHtml(String(s.status ?? 'N/A'))}</td>
        <td><strong>${s.count ?? 0}</strong></td>
        <td>
          <div class="bar-wrap">
            <div class="bar" style="width:${Number(s.percentage ?? 0).toFixed(1)}%"></div>
            <span>${Number(s.percentage ?? 0).toFixed(1)}%</span>
          </div>
        </td>
      </tr>`).join('')
    : `<tr><td colspan="3" style="color:#6b7280;font-style:italic;">
        Lead distribution not available yet. Run test 1B to complete this section.
       </td></tr>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Task 1 — Salesforce Leads Report</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f4f6f9;color:#1a1a2e}
    .header{background:linear-gradient(135deg,#0070d2,#1589ee);color:#fff;padding:32px 40px}
    .header h1{font-size:22px;font-weight:700}
    .header p{opacity:.85;margin-top:4px;font-size:13px}
    .container{max-width:920px;margin:28px auto;padding:0 20px}
    .card{background:#fff;border-radius:8px;box-shadow:0 1px 4px rgba(0,0,0,.1);margin-bottom:20px;overflow:hidden}
    .card-head{padding:14px 20px;border-bottom:1px solid #e5e7eb;background:#f9fafb;display:flex;align-items:center;gap:8px;flex-wrap:wrap}
    .card-head h2{font-size:15px;font-weight:600;color:#374151;flex:1}
    .card-body{padding:20px}
    .badge{padding:3px 10px;border-radius:12px;font-size:11px;font-weight:600}
    .ok{background:#d1fae5;color:#065f46}
    .fail{background:#fee2e2;color:#991b1b}
    .info{background:#dbeafe;color:#1e40af}
    .warn{background:#fef3c7;color:#92400e}
    .grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
    .meta label{font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:.4px}
    .meta p{font-size:14px;color:#111827;margin-top:2px;font-weight:500}
    table{width:100%;border-collapse:collapse}
    th{text-align:left;padding:9px 12px;font-size:11px;text-transform:uppercase;color:#6b7280;border-bottom:2px solid #e5e7eb}
    td{padding:11px 12px;font-size:13px;border-bottom:1px solid #f3f4f6}
    .bar-wrap{display:flex;align-items:center;gap:8px}
    .bar{height:8px;background:#0070d2;border-radius:4px;min-width:4px}
    .summary{background:#f0f7ff;border-left:4px solid #0070d2;padding:14px 18px;border-radius:0 6px 6px 0;font-size:14px;line-height:1.6;color:#1a2e4a}
    .box{background:#f9fafb;border:1px solid #e5e7eb;border-radius:6px;padding:11px 14px;font-size:13px;color:#374151;line-height:1.5;white-space:pre-wrap}
    .stat{font-size:44px;font-weight:700;color:#0070d2;text-align:center}
    .stat-label{font-size:13px;color:#6b7280;text-align:center;margin-top:2px}
    .conf-bg{height:6px;background:#e5e7eb;border-radius:3px;overflow:hidden;margin-top:6px}
    .conf-fill{height:100%;border-radius:3px;background:#10b981}
  </style>
</head>
<body>
<div class="header">
  <h1>⚡ Task 1 — Salesforce Lead Automation Report</h1>
  <p>Generated: ${escapeHtml(report.generatedAt ?? nowISO())} &nbsp;|&nbsp; Playwright · TypeScript · AI</p>
</div>

<div class="container">

  <div class="card">
    <div class="card-head">
      <h2>Execution Scope</h2>
      <span class="badge ${isPartial ? 'warn' : 'ok'}">${isPartial ? 'PARTIAL REPORT' : 'COMPLETE REPORT'}</span>
      <span class="badge info">Steps: ${escapeHtml(completedSteps.join(', ') || 'N/A')}</span>
    </div>
    <div class="card-body">
      <div class="box">${isPartial
      ? 'This report was generated from test 1A only. Lead extraction and distribution metrics will be completed after test 1B runs.'
      : 'This report includes both Task 1A and Task 1B: lead creation, AI assertion, lead extraction, distribution analysis, and AI summary.'
    }</div>
    </div>
  </div>

  <div class="card">
    <div class="card-head">
      <h2>Lead Creation</h2>
      <span class="badge ${leadCreation?.success ? 'ok' : 'fail'}">${leadCreation?.success ? '✅ PASS' : '❌ FAIL'}</span>
    </div>
    <div class="card-body">
      <div class="grid">
        <div class="meta"><label>Full Name</label><p>${escapeHtml(`${leadCreation?.leadData?.firstName ?? 'N/A'} ${leadCreation?.leadData?.lastName ?? ''}`)}</p></div>
        <div class="meta"><label>Company</label><p>${escapeHtml(leadCreation?.leadData?.company ?? 'N/A')}</p></div>
        <div class="meta"><label>Email</label><p>${escapeHtml(leadCreation?.leadData?.email ?? 'N/A')}</p></div>
        <div class="meta"><label>Phone</label><p>${escapeHtml(leadCreation?.leadData?.phone ?? 'N/A')}</p></div>
        <div class="meta"><label>Lead Status</label><p>${escapeHtml(leadCreation?.leadData?.status ?? 'N/A')}</p></div>
        <div class="meta"><label>Timestamp</label><p>${escapeHtml(leadCreation?.timestamp ?? 'N/A')}</p></div>
      </div>
    </div>
  </div>

  <div class="card">
    <div class="card-head">
      <h2>AI Assertion Reasoning</h2>
      <span class="badge ${aiAssertionResult?.passed ? 'ok' : 'fail'}">${aiAssertionResult?.passed ? '✅ PASS' : '❌ FAIL'}</span>
      <span class="badge info">Confidence: ${(Number(aiAssertionResult?.confidence ?? 0) * 100).toFixed(0)}%</span>
    </div>
    <div class="card-body">
      <div class="conf-bg">
        <div class="conf-fill" style="width:${Number(aiAssertionResult?.confidence ?? 0) * 100}%"></div>
      </div>
      <p style="margin:12px 0 5px;font-size:11px;color:#6b7280;text-transform:uppercase">Reasoning</p>
      <div class="box">${escapeHtml(aiAssertionResult?.reasoning ?? 'No reasoning available.')}</div>
      <p style="margin:12px 0 5px;font-size:11px;color:#6b7280;text-transform:uppercase">Key Evidence</p>
      <div class="box"><em>"${escapeHtml(
      Array.isArray(aiAssertionResult?.keyEvidence)
        ? aiAssertionResult.keyEvidence.join(' | ')
        : aiAssertionResult?.keyEvidence ?? ''
    )}"</em></div>
    </div>
  </div>

  <div class="card">
    <div class="card-head">
      <h2>Leads Distribution</h2>
      <span class="badge info">${totalCount} total</span>
    </div>
    <div class="card-body">
      <div class="stat">${totalCount}</div>
      <div class="stat-label">Total Leads in System</div>
      <br>
      <table>
        <thead><tr><th>Status</th><th>Count</th><th>Distribution</th></tr></thead>
        <tbody>${statusRows}</tbody>
      </table>
    </div>
  </div>

  <div class="card">
    <div class="card-head">
      <h2>AI-Generated Summary</h2>
      <span class="badge info">AI</span>
    </div>
    <div class="card-body">
      <div class="summary">${escapeHtml(aiSummary ?? 'Summary not available yet.')}</div>
    </div>
  </div>

</div>
</body>
</html>`;
}

function escapeHtml(input: string): string {
  return String(input)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

// ── Task 2 ────────────────────────────────────────────────────────────────────
export function saveTask2JSON(scenarios: ScenarioResult[], runId: string): void {
  const passed = scenarios.filter((s) => s.passed).length;
  const report = {
    scenarios,
    totalPassed: passed,
    totalFailed: scenarios.length - passed,
    passRate: `${((passed / scenarios.length) * 100).toFixed(0)}%`,
    generatedAt: nowISO(),
  };
  saveJSONTimestamped(`task2-report.${runId}`, report);
}

export function saveTask2HTML(scenarios: ScenarioResult[], runId: string): void {
  const passed = scenarios.filter((s) => s.passed).length;
  const total = scenarios.length;
  const passRate = ((passed / total) * 100).toFixed(0);

  const cards = scenarios.map((s) => `
  <div class="card">
    <div class="card-head">
      <h2>Scenario ${s.scenario.id}: ${escapeHtml(s.scenario.title)}</h2>
      <span class="badge ${s.passed ? 'ok' : 'fail'}">${s.passed ? '✅ PASS' : '❌ FAIL'}</span>
      <span class="badge info">Confidence: ${(s.aiVerdict.confidence * 100).toFixed(0)}%</span>
      <span class="badge info">⏱ ${s.agentResponse.responseTimeMs}ms</span>
    </div>
    <div class="card-body">
      <p class="label">User Input</p>
      <div class="box mb"><strong>"${escapeHtml(s.scenario.userInput)}"</strong></div>
      <p class="label">Agent Response</p>
      <div class="box mb">${escapeHtml(s.agentResponse.rawText || 'No response captured')}</div>
      ${s.agentResponse.usefulLinks.length
      ? `<p class="label">Links Found</p>
           <div class="box mb">${s.agentResponse.usefulLinks.map((l) =>
        `<a href="${escapeHtml(l)}" target="_blank">${escapeHtml(l)}</a>`
      ).join('<br>')}</div>`
      : ''}
      <p class="label">AI Reasoning</p>
      <div class="box mb">${escapeHtml(s.aiVerdict.reasoning)}</div>
      <p class="label">Key Evidence</p>
      <div class="box"><em>"${escapeHtml(s.aiVerdict.keyEvidence)}"</em></div>
    </div>
  </div>`).join('');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Task 2 — Agentforce Testing Report</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f4f6f9;color:#1a1a2e}
    .header{background:linear-gradient(135deg,#5c35cc,#8b5cf6);color:#fff;padding:32px 40px}
    .header h1{font-size:22px;font-weight:700}
    .header p{opacity:.85;margin-top:4px;font-size:13px}
    .container{max-width:920px;margin:28px auto;padding:0 20px}
    .summary-row{display:flex;gap:16px;margin-bottom:20px}
    .stat-card{background:#fff;border-radius:8px;box-shadow:0 1px 4px rgba(0,0,0,.1);flex:1;text-align:center;padding:20px}
    .stat-num{font-size:36px;font-weight:700}
    .green{color:#10b981} .red{color:#ef4444} .purple{color:#7c3aed}
    .stat-lbl{font-size:12px;color:#6b7280;margin-top:3px}
    .card{background:#fff;border-radius:8px;box-shadow:0 1px 4px rgba(0,0,0,.1);margin-bottom:18px;overflow:hidden}
    .card-head{padding:14px 20px;border-bottom:1px solid #e5e7eb;background:#f9fafb;display:flex;align-items:center;gap:8px;flex-wrap:wrap}
    .card-head h2{font-size:14px;font-weight:600;color:#374151;flex:1}
    .card-body{padding:20px}
    .badge{padding:3px 10px;border-radius:12px;font-size:11px;font-weight:600}
    .ok{background:#d1fae5;color:#065f46}
    .fail{background:#fee2e2;color:#991b1b}
    .info{background:#ede9fe;color:#5b21b6}
    .box{background:#f9fafb;border:1px solid #e5e7eb;border-radius:6px;padding:11px 14px;font-size:13px;color:#374151;line-height:1.5}
    .mb{margin-bottom:12px}
    .label{font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:.4px;margin-bottom:5px}
    a{color:#0070d2}
  </style>
</head>
<body>
<div class="header">
  <h1>Task 2 — Agentforce Interaction Testing Report</h1>
  <p>Generated: ${nowISO()} &nbsp;|&nbsp; Intent-Based AI Validation · Groq</p>
</div>
<div class="container">
  <div class="summary-row">
    <div class="stat-card"><div class="stat-num green">${passed}</div><div class="stat-lbl">Passed</div></div>
    <div class="stat-card"><div class="stat-num red">${total - passed}</div><div class="stat-lbl">Failed</div></div>
    <div class="stat-card"><div class="stat-num purple">${passRate}%</div><div class="stat-lbl">Pass Rate</div></div>
  </div>
  ${cards}
</div>
</body>
</html>`;

  const filePath = path.join(REPORTS_HTML_DIR, `task2-report.${runId}.html`);
  writeFile(filePath, html);
  console.log(`[reportService] HTML saved → ${filePath}`);
}
