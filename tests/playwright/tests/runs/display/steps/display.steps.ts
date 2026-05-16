/**
 * Step definitions for runs/display feature files.
 *
 * Reuses: common.steps.ts, line-plot.steps.ts (workspace load, chart content),
 *         project-page.steps.ts (project name visible)
 */
import { expect } from '@playwright/test';
import { Given, When, Then } from '../../../../steps/fixtures';

// ---------------------------------------------------------------------------
// When — navigation
// ---------------------------------------------------------------------------

When(
  'I navigate to the display project table page',
  async ({ authedPage, targetConfig, sdkData }) => {
    await authedPage.goto(
      `${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/table`
    );
    await authedPage.getByText('Name').first().waitFor({ timeout: 30_000 });
    await authedPage.waitForTimeout(2000);
  }
);

When(
  'I open the forked run overview page',
  async ({ authedPage, targetConfig, sdkData }) => {
    const run = sdkData.runs[6]; // eta-forked
    await authedPage.goto(
      `${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/runs/${run.id}/overview`
    );
    await authedPage.getByRole('tab', { name: /Overview/i }).first().waitFor({ timeout: 30_000 });
    await authedPage.waitForTimeout(2000);
  }
);

When(
  'I open the forked run charts page',
  async ({ authedPage, targetConfig, sdkData }) => {
    const run = sdkData.runs[6]; // eta-forked
    await authedPage.goto(
      `${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/runs/${run.id}`
    );
    await authedPage.getByRole('tab', { name: /Charts/i }).first().waitFor({ timeout: 30_000 });
    await authedPage.waitForTimeout(3000);
  }
);

When(
  'I open the resumed run charts page',
  async ({ authedPage, targetConfig, sdkData }) => {
    const run = sdkData.runs[2]; // gamma-run
    await authedPage.goto(
      `${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/runs/${run.id}`
    );
    await authedPage.getByRole('tab', { name: /Charts/i }).first().waitFor({ timeout: 30_000 });
    await authedPage.waitForTimeout(3000);
  }
);

// ---------------------------------------------------------------------------
// Then — run name assertions
// ---------------------------------------------------------------------------

Then(
  'the first display run name should be visible',
  async ({ authedPage, sdkData }) => {
    const runName = sdkData.runs[0].displayName || sdkData.runs[0].name;
    await expect(authedPage.getByText(runName).first()).toBeVisible({ timeout: 10_000 });
  }
);

Then(
  'the second display run name should be visible',
  async ({ authedPage, sdkData }) => {
    const runName = sdkData.runs[1].displayName || sdkData.runs[1].name;
    await expect(authedPage.getByText(runName).first()).toBeVisible({ timeout: 10_000 });
  }
);

Then(
  'the forked run name should be visible',
  async ({ authedPage, sdkData }) => {
    const run = sdkData.runs[6]; // eta-forked
    const runName = run.displayName || run.name;
    await expect(authedPage.getByText(runName).first()).toBeVisible({ timeout: 10_000 });
  }
);

Then(
  'the resumed run name should be visible',
  async ({ authedPage, sdkData }) => {
    const run = sdkData.runs[2]; // gamma-run
    const runName = run.displayName || run.name;
    await expect(authedPage.getByText(runName).first()).toBeVisible({ timeout: 10_000 });
  }
);

// ---------------------------------------------------------------------------
// Then — table assertions
// ---------------------------------------------------------------------------

Then(
  'I should see run selection checkboxes',
  async ({ authedPage }) => {
    const checkboxes = authedPage.getByRole('checkbox');
    const count = await checkboxes.count();
    expect(count).toBeGreaterThanOrEqual(1);
  }
);

Then(
  'I should see table control buttons',
  async ({ authedPage }) => {
    await expect(
      authedPage.getByRole('button', { name: /Columns|Filter|Group|Sort/i }).first()
    ).toBeVisible({ timeout: 10_000 });
  }
);

Then(
  'I should see the Columns button',
  async ({ authedPage }) => {
    await expect(
      authedPage.getByRole('button', { name: /Columns/i }).first()
    ).toBeVisible({ timeout: 10_000 });
  }
);

Then(
  'I should see table header text',
  async ({ authedPage }) => {
    await expect(
      authedPage.getByText(/Name|State|Created/i).first()
    ).toBeVisible({ timeout: 10_000 });
  }
);

Then(
  'I should see the Sort button',
  async ({ authedPage }) => {
    await expect(
      authedPage.getByRole('button', { name: /Sort/i }).first()
    ).toBeVisible({ timeout: 10_000 });
  }
);

Then(
  'I should see a search input',
  async ({ authedPage }) => {
    const searchBox = authedPage.getByRole('searchbox')
      .or(authedPage.getByPlaceholder(/Search/i));
    await expect(searchBox.first()).toBeVisible({ timeout: 10_000 });
  }
);

Then(
  'I should see run state badges',
  async ({ authedPage }) => {
    await expect(
      authedPage.getByText(/Finished|Crashed|Running/i).first()
    ).toBeVisible({ timeout: 10_000 });
  }
);

// ---------------------------------------------------------------------------
// Then — overview / chart assertions
// ---------------------------------------------------------------------------

Then(
  'I should see overview or state content',
  async ({ authedPage }) => {
    await expect(
      authedPage.getByText(/Overview|State|Created|Finished/i).first()
    ).toBeVisible({ timeout: 10_000 });
  }
);

Then(
  'I should see metric chart content',
  async ({ authedPage }) => {
    await expect(
      authedPage.getByText(/loss|accuracy|train/i).first()
    ).toBeVisible({ timeout: 10_000 });
  }
);
