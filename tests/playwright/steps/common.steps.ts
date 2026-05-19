/**
 * Shared step definitions used across multiple feature areas.
 *
 * These steps operate on the standard fixtures: authedPage, targetConfig, sdkData.
 * Feature-specific steps live in tests/{area}/steps/*.steps.ts.
 */
import { expect } from '@playwright/test';
import { Given, When, Then, test } from './fixtures';

// ---------------------------------------------------------------------------
// Given — SDK data lookups
// ---------------------------------------------------------------------------

Given(
  'a run named {string} exists',
  async ({ sdkData }, displayName: string) => {
    const match = sdkData.runs.find(
      (r) => r.displayName === displayName || r.name === displayName
    );
    expect(match, `Run '${displayName}' not found in SDK manifest`).toBeTruthy();
    // Stash on sdkData for downstream steps
    (sdkData as any)._currentRun = match;
  }
);

Given(
  'the SDK setup has completed',
  async ({ sdkData }) => {
    expect(sdkData.project).toBeTruthy();
  }
);

// ---------------------------------------------------------------------------
// When — navigation
// ---------------------------------------------------------------------------

When(
  'I open the run overview page',
  async ({ authedPage, targetConfig, sdkData }) => {
    const run = (sdkData as any)._currentRun ?? sdkData.runs[0];
    const url = `${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/runs/${run.id}/overview`;
    await authedPage.goto(url);
    await authedPage.getByRole('tab', { name: 'Overview' }).waitFor();
  }
);

When(
  'I open the run charts page',
  async ({ authedPage, targetConfig, sdkData }) => {
    const run = (sdkData as any)._currentRun ?? sdkData.runs[0];
    const url = `${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/runs/${run.id}`;
    await authedPage.goto(url);
    await authedPage.getByRole('tab', { name: /Charts/i }).waitFor();
  }
);

When(
  'I open the project workspace',
  async ({ authedPage, targetConfig, sdkData }) => {
    const url = `${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/workspace`;
    await authedPage.goto(url);
    await authedPage.getByRole('heading').first().waitFor({ timeout: 30_000 });
  }
);

When(
  'I open the project page',
  async ({ authedPage, targetConfig, sdkData }) => {
    const url = `${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}`;
    await authedPage.goto(url);
    // Wait for page to settle — just wait for any heading or link.
    await authedPage.getByRole('heading').or(authedPage.getByRole('link')).first().waitFor({ timeout: 30_000 });
    await authedPage.waitForTimeout(2000);
  }
);

When(
  'I switch to the {string} tab',
  async ({ authedPage }, tabName: string) => {
    await authedPage.getByRole('tab', { name: new RegExp(tabName, 'i') }).click();
    // Wait for content to settle — some tabs don't have role="tabpanel"
    await authedPage.waitForTimeout(2000);
  }
);

// ---------------------------------------------------------------------------
// Then — config section assertions
// ---------------------------------------------------------------------------

Then(
  'the config section should show {string} with value {string}',
  async ({ authedPage }, key: string, value: string) => {
    const configSection = authedPage
      .getByRole('list')
      .filter({ hasText: 'Config parameters' });
    await configSection.waitFor();

    await expect(configSection.getByText(`${key}:`, { exact: true })).toBeVisible();
    // Use regex word boundary for short numeric values to avoid partial matches
    if (/^\d{1,3}$/.test(value)) {
      await expect(
        configSection.getByText(new RegExp(`\\b${value}\\b`))
      ).toBeVisible();
    } else {
      await expect(configSection.getByText(value)).toBeVisible();
    }
  }
);

// ---------------------------------------------------------------------------
// Then — summary section assertions
// ---------------------------------------------------------------------------

Then(
  'the summary section should show {string} with value {string}',
  async ({ authedPage }, key: string, value: string) => {
    const summarySection = authedPage
      .getByRole('list')
      .filter({ hasText: 'Summary metrics' });
    await summarySection.waitFor();

    await expect(summarySection.getByText(`${key}:`)).toBeVisible();
    await expect(summarySection.getByText(value)).toBeVisible();
  }
);

Then(
  'the summary section should show {string}',
  async ({ authedPage }, key: string) => {
    const summarySection = authedPage
      .getByRole('list')
      .filter({ hasText: 'Summary metrics' });
    await expect(summarySection).toBeVisible({ timeout: 10_000 });
    await expect(summarySection.getByText(key)).toBeVisible({ timeout: 10_000 });
  }
);

// ---------------------------------------------------------------------------
// Then — generic visibility
// ---------------------------------------------------------------------------

Then(
  'I should see {string}',
  async ({ authedPage }, text: string) => {
    await expect(authedPage.getByText(text).first()).toBeVisible({ timeout: 10_000 });
  }
);

Then(
  'I should see a tab named {string}',
  async ({ authedPage }, tabName: string) => {
    await expect(
      authedPage.getByRole('tab', { name: new RegExp(tabName, 'i') })
    ).toBeVisible();
  }
);

Then(
  'the {string} tab should be active',
  async ({ authedPage }, tabName: string) => {
    await expect(
      authedPage.getByRole('tab', { name: new RegExp(tabName, 'i'), selected: true })
    ).toBeVisible();
  }
);

// ---------------------------------------------------------------------------
// When — page interactions
// ---------------------------------------------------------------------------

When(
  'I scroll to the bottom of the page',
  async ({ authedPage }) => {
    await authedPage.keyboard.press('End');
    await authedPage.waitForTimeout(1000);
  }
);

// "I click the Sort button" lives in tests/track/workspaces/steps/workspaces.steps.ts

// ---------------------------------------------------------------------------
// Then — chart / workspace assertions
// ---------------------------------------------------------------------------

Then(
  'I should see a chart for {string}',
  async ({ authedPage }, metricName: string) => {
    await expect(
      authedPage.getByText(metricName, { exact: true }).first()
    ).toBeVisible({ timeout: 15_000 });
  }
);

Then(
  'the runs table should show {int} run(s)',
  async ({ authedPage }, count: number) => {
    const rows = authedPage.getByRole('table').first().getByRole('row');
    // Subtract 1 for header row
    await expect(rows).toHaveCount(count + 1, { timeout: 15_000 });
  }
);
