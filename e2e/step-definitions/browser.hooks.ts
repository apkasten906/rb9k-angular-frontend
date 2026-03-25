/**
 * Playwright lifecycle hooks for Cucumber E2E tests.
 *
 * Strategy:
 *  - One shared Browser instance for the entire test run (BeforeAll / AfterAll).
 *  - A fresh BrowserContext + Page for every scenario (Before / After) to ensure
 *    full isolation of cookies, local-storage, and in-page state.
 */
import { BeforeAll, AfterAll, Before, After, ITestCaseHookParameter } from '@cucumber/cucumber';
import { chromium, Browser } from '@playwright/test';
import { AppWorld } from './world';

let sharedBrowser: Browser;

BeforeAll(async function () {
  sharedBrowser = await chromium.launch({
    headless: !process.env['PLAYWRIGHT_HEADED'],
  });
});

Before<AppWorld>(async function (this: AppWorld, _scenario: ITestCaseHookParameter) {
  const baseURL = process.env['BASE_URL'] ?? 'http://localhost:4200';
  this.browserContext = await sharedBrowser.newContext({ baseURL });
  this.page = await this.browserContext.newPage();
});

After<AppWorld>(async function (this: AppWorld) {
  await this.page?.close();
  await this.browserContext?.close();
});

AfterAll(async function () {
  await sharedBrowser?.close();
});
