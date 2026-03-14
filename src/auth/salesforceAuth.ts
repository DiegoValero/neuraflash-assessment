import { Browser, BrowserContext, chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { env } from '../config/env';

export const SF_AUTH_FILE = path.join('playwright', '.auth', 'salesforce.json');

const SESSION_MAX_AGE_MS = 2 * 60 * 60 * 1000;

function isSessionFresh(authFile: string): boolean {
  if (!fs.existsSync(authFile)) {
    return false;
  }

  const ageMs = Date.now() - fs.statSync(authFile).mtimeMs;
  const fresh = ageMs < SESSION_MAX_AGE_MS;

  if (!fresh) {
    console.log(`Session expired (age: ${(ageMs / 3600000).toFixed(1)}h) — will refresh.`);
  }

  return fresh;
}

function ensureAuthDir(authFile: string): void {
  const dir = path.dirname(authFile);

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

async function saveSession(context: BrowserContext, authFile: string): Promise<void> {
  ensureAuthDir(authFile);
  await context.storageState({ path: authFile });
  console.log(`Session saved → ${authFile}`);
}

async function loginManual(browser: Browser): Promise<void> {
  console.log('\nOpening browser for manual login...');
  console.log('Complete email verification if prompted.');
  console.log('Window closes automatically after successful login.\n');

  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto(env.salesforce.loginUrl);
  await page.locator('#username').fill(env.salesforce.username);
  await page.locator('#password').fill(env.salesforce.password);
  await page.locator('#Login').click();

  console.log('Waiting for login to complete (up to 3 minutes)...');

  await page.waitForURL(
    (url) =>
      url.href.includes('.salesforce.com') &&
      !url.href.includes('login.salesforce.com') &&
      !url.href.includes('verification') &&
      !url.href.includes('secur/login'),
    { timeout: 180_000 }
  );

  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(2_000);

  console.log(`Login successful → ${page.url()}`);
  await saveSession(context, SF_AUTH_FILE);
  await context.close();
}

export async function ensureSFSession(): Promise<void> {
  console.log('\nChecking Salesforce session...');

  if (isSessionFresh(SF_AUTH_FILE)) {
    console.log('Session is fresh — skipping login.');
    return;
  }

  console.log('Session needs refresh — opening browser...');
  const browser = await chromium.launch({ headless: false });

  try {
    await loginManual(browser);
  } finally {
    await browser.close();
  }
}

export async function forceSFLogin(): Promise<void> {
  console.log('\nForcing fresh Salesforce login...');
  const browser = await chromium.launch({ headless: false });

  try {
    await loginManual(browser);
    console.log('Session refreshed.');
  } finally {
    await browser.close();
  }
}