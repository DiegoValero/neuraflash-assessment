import { Locator, Page } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { env } from '../config/env';
import { AgentResponse } from '../types/ai';
import { nowSlug } from '../utils/dateUtils';
import { ensureDir } from '../utils/fileUtils';
import { BasePage } from './BasePage';

export class AgentforceWidgetPage extends BasePage {
  private readonly cookieAcceptBtn: Locator;
  private readonly msgInput: Locator;
  private readonly sendBtn: Locator;

  constructor(page: Page) {
    super(page);
    this.cookieAcceptBtn = this.page.locator('#onetrust-accept-btn-handler');
    this.msgInput = this.page.getByRole('textbox', { name: 'Ask Agentforce' });
    this.sendBtn = this.page.getByRole('button', { name: 'Message Agentforce' });
  }

  private frameLocator() {
    return this.page.frameLocator('iframe.embeddedMessagingFrame');
  }

  private get agentMsgs() {
    return this.frameLocator().locator('li.slds-chat-listitem_inbound');
  }

  private get widgetContainer() {
    return this.page.locator('iframe.embeddedMessagingFrame');
  }

  async navigateToHelpPortal(): Promise<void> {
    await this.page.goto(env.agentforce.loginUrl, { waitUntil: 'domcontentloaded' });
    await this.waitForReady();
    console.log('[AgentforceWidgetPage] Help portal loaded');
  }

  async acceptCookiesIfPresent(): Promise<void> {
    try {
      const visible = await this.cookieAcceptBtn.isVisible({ timeout: 4_000 });
      if (visible) {
        await this.cookieAcceptBtn.click();
        await this.cookieAcceptBtn.waitFor({ state: 'hidden', timeout: 5_000 });
        console.log('[AgentforceWidgetPage] Cookies accepted');
      }
    } catch {
      return;
    }
  }

  async openWidget(): Promise<void> {
    await this.acceptCookiesIfPresent();
    await this.msgInput.waitFor({ state: 'visible', timeout: 20_000 });
    console.log('[AgentforceWidgetPage] Chat widget ready');
  }

  async sendMessage(message: string): Promise<void> {
    await this.msgInput.waitFor({ state: 'visible', timeout: 15_000 });
    await this.msgInput.fill(message);
    console.log(`[AgentforceWidgetPage] Message filled: "${message}"`);
  }

  async submitMessage(): Promise<void> {
    const isEnabled = await this.sendBtn.isEnabled().catch(() => false);

    if (isEnabled) {
      await this.sendBtn.click();
      console.log('[AgentforceWidgetPage] Message submitted via button');
    } else {
      await this.msgInput.press('Enter');
      console.log('[AgentforceWidgetPage] Message submitted via Enter key');
    }

    await this.widgetContainer.waitFor({ state: 'visible', timeout: 20_000 });
    await this.agentMsgs.first().waitFor({ state: 'visible', timeout: 20_000 });
    console.log('[AgentforceWidgetPage] Widget ready — first agent message visible');
  }

  private async getLastAgentText(): Promise<string> {
    const count = await this.agentMsgs.count();
    if (count === 0) return '';

    const last = this.agentMsgs.last();

    try {
      const paragraphs = last.locator('span[part="formatted-rich-text"] p');
      const pCount = await paragraphs.count();
      const texts: string[] = [];

      for (let i = 0; i < pCount; i++) {
        const text = (await paragraphs.nth(i).innerText()).trim();
        if (text) texts.push(text);
      }

      return texts.join('\n');
    } catch {
      return (await last.innerText()).trim();
    }
  }

  async waitForAgentResponse(initialCount: number, timeoutMs = 60_000): Promise<void> {
    const deadline = Date.now() + timeoutMs;

    while (Date.now() < deadline) {
      const current = await this.agentMsgs.count();

      if (current > initialCount) {
        console.log('[AgentforceWidgetPage] New agent message detected — waiting for streaming to finish...');

        let prevText = '';
        let stableCount = 0;

        while (stableCount < 2 && Date.now() < deadline) {
          await this.agentMsgs
            .last()
            .locator('span[part="formatted-rich-text"]')
            .waitFor({ state: 'visible', timeout: 10_000 });

          const currentText = await this.getLastAgentText();

          if (currentText.length > 0 && currentText === prevText) {
            stableCount++;
          } else {
            stableCount = 0;
            prevText = currentText;
          }

          await this.page.waitForTimeout(800);
        }

        console.log(`[AgentforceWidgetPage] Agent response complete — ${prevText.length} chars`);
        return;
      }

      await this.page.waitForTimeout(500);
    }

    throw new Error(`Agent did not respond within ${timeoutMs}ms`);
  }

  async extractLinks(): Promise<string[]> {
    const lastMsg = this.agentMsgs.last();
    const links = lastMsg.locator('a[href]');
    const count = await links.count();
    const urls: string[] = [];

    for (let i = 0; i < count; i++) {
      const href = await links.nth(i).getAttribute('href');
      if (href?.startsWith('http')) urls.push(href);
    }

    return [...new Set(urls)];
  }

  private async scrollToLastMessage(): Promise<void> {
    await this.agentMsgs.last().scrollIntoViewIfNeeded();
    console.log('[AgentforceWidgetPage] Scrolled to last agent message');
  }

  async runScenario(userInput: string): Promise<AgentResponse> {
    await this.sendMessage(userInput);

    const start = Date.now();
    await this.submitMessage();

    const initialCount = await this.agentMsgs.count();
    await this.waitForAgentResponse(initialCount);
    const responseTimeMs = Date.now() - start;

    const rawText = await this.getLastAgentText();
    const usefulLinks = await this.extractLinks();

    await this.scrollToLastMessage();

    const screenshotBuffer = await this.widgetContainer.screenshot();
    const dir = path.join('reports', 'screenshots');
    ensureDir(dir);
    const filePath = path.join(dir, `agentforce_${Date.now()}_${nowSlug()}.png`);
    fs.writeFileSync(filePath, screenshotBuffer);
    console.log(`[Screenshot] → ${filePath}`);

    console.log(`[AgentforceWidgetPage] Response in ${responseTimeMs}ms — ${rawText.length} chars`);

    return { rawText, usefulLinks, responseTimeMs, screenshotPath: filePath };
  }

  async closeAndReopen(): Promise<void> {
    await this.navigateToHelpPortal();
    await this.openWidget();
  }
}