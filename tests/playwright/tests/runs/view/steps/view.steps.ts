/**
 * Step definitions specific to runs/view feature files.
 *
 * Reusable steps live in steps/common.steps.ts and
 * tests/track/summary/steps/summary.steps.ts.
 * Only view-area-specific steps belong here.
 */
import { expect } from '@playwright/test';
import { Given, When, Then } from '../../../../steps/fixtures';

// ---------------------------------------------------------------------------
// When — navigation
// ---------------------------------------------------------------------------

When(
  'I open the run detail page',
  async ({ authedPage, targetConfig, sdkData }) => {
    const run = (sdkData as any)._currentRun ?? sdkData.runs[0];
    const url = `${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/runs/${run.id}`;
    await authedPage.goto(url);
    await authedPage.getByRole('tab', { name: 'Overview' }).waitFor({ timeout: 30_000 });
  }
);

When(
  'I open the run logs page',
  async ({ authedPage, targetConfig, sdkData }) => {
    const run = (sdkData as any)._currentRun ?? sdkData.runs[0];
    const url = `${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/runs/${run.id}/logs`;
    await authedPage.goto(url);
    await authedPage.waitForTimeout(3000);
  }
);

When(
  'I expand any collapsed chart sections',
  async ({ authedPage }) => {
    await authedPage.waitForTimeout(2000);
    const expandButtons = authedPage.getByRole('button', { name: /expand/i });
    const expandCount = await expandButtons.count();
    for (let i = 0; i < expandCount; i++) {
      await expandButtons.nth(i).click();
      await authedPage.waitForTimeout(500);
    }
  }
);

When(
  'I click the Artifacts tab if visible',
  async ({ authedPage }) => {
    const artifactsTab = authedPage.getByRole('tab', { name: 'Artifacts' });
    if (await artifactsTab.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await artifactsTab.click();
      await authedPage.waitForTimeout(2000);
    }
  }
);

// ---------------------------------------------------------------------------
// When — search interactions
// ---------------------------------------------------------------------------

When(
  'I search the config section for {string}',
  async ({ authedPage }, query: string) => {
    const searchBox = authedPage.getByPlaceholder('search keys with regex');
    await searchBox.first().fill(query);
  }
);

When(
  'I clear the config search box',
  async ({ authedPage }) => {
    const searchBox = authedPage.getByPlaceholder('search keys with regex');
    await searchBox.first().clear();
  }
);

When(
  'I search the summary section for {string}',
  async ({ authedPage }, query: string) => {
    const searchBoxes = authedPage.getByPlaceholder('search keys with regex');
    await searchBoxes.last().fill(query);
  }
);

When(
  'I clear the summary search box',
  async ({ authedPage }) => {
    const searchBoxes = authedPage.getByPlaceholder('search keys with regex');
    await searchBoxes.last().clear();
  }
);

// ---------------------------------------------------------------------------
// Then — artifacts assertions
// ---------------------------------------------------------------------------

Then(
  'I should see artifacts content or the Charts tab as fallback',
  async ({ authedPage }) => {
    // Artifacts tab may show content, or may not exist on bandw.
    // Use role-based locator for Artifacts tab to avoid matching run names.
    await expect(
      authedPage.getByRole('tab', { name: /Artifacts/i })
        .or(authedPage.getByRole('tab', { name: 'Charts' }))
        .first()
    ).toBeVisible({ timeout: 10_000 });
  }
);

// ---------------------------------------------------------------------------
// Then — overview editable assertions
// ---------------------------------------------------------------------------

Then(
  'I should see the notes section',
  async ({ authedPage }) => {
    await expect(authedPage.getByText(/notes/i).first()).toBeVisible({ timeout: 10_000 });
  }
);

Then(
  'I should see tag {string}',
  async ({ authedPage }, tagName: string) => {
    // Scope to the Overview tab panel to avoid matching tags in sidebar/table
    const overview = authedPage.getByRole('tabpanel').or(authedPage.locator('main'));
    await expect(
      overview.getByText(tagName, { exact: true }).first()
    ).toBeVisible({ timeout: 10_000 });
  }
);

Then(
  'I should see the add tag button',
  async ({ authedPage }) => {
    await expect(
      authedPage.getByRole('button', { name: '+' })
        .or(authedPage.getByText('+', { exact: true }).first())
    ).toBeVisible({ timeout: 10_000 });
  }
);

// ---------------------------------------------------------------------------
// Then — overview metadata assertions
// ---------------------------------------------------------------------------

Then(
  'the run state should show finished',
  async ({ authedPage }) => {
    await expect(
      authedPage.getByText(/[Ff]inished/).first()
    ).toBeVisible({ timeout: 10_000 });
  }
);

Then(
  'the run ID should be visible on the page',
  async ({ authedPage, sdkData }) => {
    const run = (sdkData as any)._currentRun ?? sdkData.runs[0];
    await expect(
      authedPage.getByText(run.id).first()
    ).toBeVisible({ timeout: 10_000 });
  }
);

Then(
  'I should see host information',
  async ({ authedPage }) => {
    await expect(
      authedPage.getByText(/Host/).first()
    ).toBeVisible({ timeout: 10_000 });
  }
);

// ---------------------------------------------------------------------------
// Then — summary section assertions (key matching variants)
// ---------------------------------------------------------------------------

Then(
  'the summary section should show a key matching {string}',
  async ({ authedPage }, keyText: string) => {
    const summarySection = authedPage
      .getByRole('list')
      .filter({ hasText: 'Summary metrics' });
    await expect(summarySection).toBeVisible({ timeout: 10_000 });
    await expect(
      summarySection.getByText(keyText, { exact: true })
        .or(summarySection.getByText(`${keyText}:`))
    ).toBeVisible({ timeout: 10_000 });
  }
);

// ---------------------------------------------------------------------------
// Then — breadcrumb / navigation assertions
// ---------------------------------------------------------------------------

Then(
  'the project name should be visible in breadcrumbs',
  async ({ authedPage, sdkData }) => {
    await expect(
      authedPage.locator(`text=${sdkData.project}`).first()
    ).toBeVisible({ timeout: 10_000 });
  }
);
