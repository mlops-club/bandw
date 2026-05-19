/**
 * Step definitions specific to track/project-page feature files.
 *
 * Shared steps live in steps/common.steps.ts.
 * Only project-page-specific steps belong here.
 */
import { expect } from '@playwright/test';
import { Given, When, Then } from '../../../../steps/fixtures';

// ---------------------------------------------------------------------------
// When — navigation
// ---------------------------------------------------------------------------

When(
  'I navigate to the project artifacts page',
  async ({ authedPage, targetConfig, sdkData }) => {
    const url = `${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/artifacts`;
    await authedPage.goto(url);
    await authedPage.waitForTimeout(2000);
  }
);

When(
  'I click the Artifacts sidebar link',
  async ({ authedPage }) => {
    const artifactsLink = authedPage.getByRole('link', { name: /Artifacts/i });
    await artifactsLink.click();
    await authedPage.waitForTimeout(2000);
  }
);

When(
  'I navigate to the project overview page',
  async ({ authedPage, targetConfig, sdkData }) => {
    const url = `${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/overview`;
    await authedPage.goto(url);
    await authedPage.waitForTimeout(2000);
  }
);

When(
  'I navigate to the project table page',
  async ({ authedPage, targetConfig, sdkData }) => {
    const url = `${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/table`;
    await authedPage.goto(url);
    await authedPage.waitForTimeout(2000);
  }
);

When(
  'I navigate to the project report list page',
  async ({ authedPage, targetConfig, sdkData }) => {
    const url = `${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/reportlist`;
    await authedPage.goto(url);
    await authedPage.waitForTimeout(3000);
  }
);

When(
  'I wait for the table to load',
  async ({ authedPage }) => {
    await authedPage.getByText('NAME').first().waitFor({ timeout: 30_000 });
  }
);

When(
  'I scroll to the end of the table',
  async ({ authedPage }) => {
    await authedPage.keyboard.press('End');
    await authedPage.waitForTimeout(1000);
  }
);

// ---------------------------------------------------------------------------
// When — table toolbar buttons
// NOTE: 'I click the Filter button', 'I click the Group button', and
//       'I click the Sort button' are defined in workspaces.steps.ts (shared)
// ---------------------------------------------------------------------------

When(
  'I click the add-filter button',
  async ({ authedPage }) => {
    await authedPage.getByRole('button', { name: /Add filter|New filter/i }).click();
    await authedPage.waitForTimeout(1000);
  }
);

When(
  'I click the {string} column header twice',
  async ({ authedPage }, columnName: string) => {
    await authedPage.getByText(columnName).first().click();
    await authedPage.waitForTimeout(1000);
    await authedPage.getByText(columnName).first().click();
    await authedPage.waitForTimeout(1000);
  }
);

// ---------------------------------------------------------------------------
// When — search
// ---------------------------------------------------------------------------

When(
  'I search for {string} in the runs search box',
  async ({ authedPage }, query: string) => {
    const searchBox = authedPage.getByRole('combobox', { name: 'Search runs' })
      .or(authedPage.getByPlaceholder('Search runs'));
    await searchBox.first().fill(query);
    await authedPage.waitForTimeout(2000);
  }
);

When(
  'I clear the runs search box',
  async ({ authedPage }) => {
    const searchBox = authedPage.getByRole('combobox', { name: 'Search runs' })
      .or(authedPage.getByPlaceholder('Search runs'));
    await searchBox.first().clear();
    await authedPage.waitForTimeout(2000);
  }
);

// ---------------------------------------------------------------------------
// Then — project-page-specific assertions
// ---------------------------------------------------------------------------

Then(
  'the project name should be visible',
  async ({ authedPage, sdkData }) => {
    await expect(authedPage.getByText(sdkData.project).first()).toBeVisible({ timeout: 10_000 });
  }
);

Then(
  'I should see a contributor indicator',
  async ({ authedPage }) => {
    await expect(authedPage.getByText(/contributor/i)).toBeVisible({ timeout: 10_000 });
  }
);

Then(
  'I should see a details or summary indicator',
  async ({ authedPage }) => {
    await expect(
      authedPage.getByText(/Details|Total runs|Contributors/i).first()
    ).toBeVisible({ timeout: 10_000 });
  }
);

Then(
  'I should see a sidebar link named {string}',
  async ({ authedPage }, linkName: string) => {
    await expect(
      authedPage.getByRole('link', { name: new RegExp(linkName, 'i') })
    ).toBeVisible({ timeout: 10_000 });
  }
);

Then(
  'the table should show the NAME column header',
  async ({ authedPage }) => {
    await expect(authedPage.getByText('NAME').first()).toBeVisible({ timeout: 10_000 });
  }
);

Then(
  'the table should show a State column header',
  async ({ authedPage }) => {
    await expect(
      authedPage.getByText('State', { exact: true }).first()
        .or(authedPage.getByText('STATE', { exact: true }).first())
    ).toBeVisible({ timeout: 10_000 });
  }
);

Then(
  'I should see a Created column header',
  async ({ authedPage }) => {
    await expect(authedPage.getByText(/Created/i).first()).toBeVisible({ timeout: 10_000 });
  }
);

Then(
  'I should see a checkbox in the table',
  async ({ authedPage }) => {
    await expect(authedPage.getByRole('checkbox').first()).toBeVisible({ timeout: 10_000 });
  }
);

Then(
  'I should see the add-filter button',
  async ({ authedPage }) => {
    await expect(
      authedPage.getByRole('button', { name: /Add filter|New filter/i })
    ).toBeVisible({ timeout: 10_000 });
  }
);

Then(
  'I should see a report indicator',
  async ({ authedPage }) => {
    await expect(authedPage.getByText(/report/i).first()).toBeVisible({ timeout: 10_000 });
  }
);

Then(
  'I should see the create report button',
  async ({ authedPage }) => {
    await expect(
      authedPage.locator('[data-test="create-report-button"]')
        .or(authedPage.getByRole('button', { name: /Create report/i }).first())
        .or(authedPage.getByRole('link', { name: /Create report/i }).first())
    ).toBeVisible({ timeout: 10_000 });
  }
);

Then(
  'the first run name should be visible',
  async ({ authedPage, sdkData }) => {
    const run0Name = sdkData.runs[0].displayName || sdkData.runs[0].name;
    await expect(authedPage.getByText(run0Name).first()).toBeVisible({ timeout: 10_000 });
  }
);
