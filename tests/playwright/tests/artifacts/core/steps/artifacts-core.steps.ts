/**
 * Step definitions for artifacts/core feature files.
 *
 * Reused from shared step files:
 * - steps/common.steps.ts: SDK setup, generic visibility
 * - tests/track/project-page/steps/project-page.steps.ts: navigate to project artifacts page
 */
import { expect } from '@playwright/test';
import { Given, When, Then } from '../../../../steps/fixtures';

// ---------------------------------------------------------------------------
// When — artifact navigation
// ---------------------------------------------------------------------------

When(
  'I should see a {string} artifact type in the sidebar',
  async ({ authedPage }, typeName: string) => {
    await expect(
      authedPage.getByRole('treeitem', { name: new RegExp(typeName) })
    ).toBeVisible({ timeout: 10_000 });
  }
);

When(
  'I click the {string} artifact type',
  async ({ authedPage }, typeName: string) => {
    await authedPage.getByRole('treeitem', { name: new RegExp(typeName) }).click();
  }
);

When(
  'I click the {string} artifact link',
  async ({ authedPage }, artifactName: string) => {
    await authedPage.getByRole('link', { name: new RegExp(artifactName) }).click();
  }
);

When(
  'I navigate to the dataset artifact {string}',
  async ({ authedPage, targetConfig, sdkData }, artifactName: string) => {
    await authedPage.goto(
      `${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/artifacts/dataset/${artifactName}`
    );
  }
);

When(
  'I navigate to the model artifact {string}',
  async ({ authedPage, targetConfig, sdkData }, artifactName: string) => {
    await authedPage.goto(
      `${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/artifacts/model/${artifactName}`
    );
  }
);

When(
  'I click the {string} artifact tab',
  async ({ authedPage }, tabName: string) => {
    await authedPage.getByRole('link', { name: tabName }).click();
  }
);

// ---------------------------------------------------------------------------
// Then — artifact page assertions
// ---------------------------------------------------------------------------

Then(
  'I should see {string} on the page',
  async ({ authedPage }, text: string) => {
    await expect(authedPage.getByText(text).first()).toBeVisible({ timeout: 10_000 });
  }
);

Then(
  'I should see artifact version {string}',
  async ({ authedPage }, version: string) => {
    await expect(
      authedPage.getByRole('link', { name: version })
    ).toBeVisible({ timeout: 10_000 });
  }
);

When(
  'I click artifact version {string}',
  async ({ authedPage }, version: string) => {
    await authedPage.getByRole('link', { name: version }).click();
  }
);

// ---------------------------------------------------------------------------
// Then — lineage graph assertions
// ---------------------------------------------------------------------------

Then(
  'the lineage graph should be visible',
  async ({ authedPage }) => {
    await expect(
      authedPage.getByRole('img', { name: /lineage/i })
        .or(authedPage.locator('[class*="lineage"]'))
        .or(authedPage.locator('[data-testid="lineage-graph"]'))
    ).toBeVisible({ timeout: 10_000 });
  }
);

When(
  'I click on {string} in the lineage graph',
  async ({ authedPage }, nodeName: string) => {
    await authedPage.getByText(nodeName).click();
  }
);

Then(
  'I should see a version indicator in the lineage',
  async ({ authedPage }) => {
    await expect(authedPage.getByText(/v\d/).first()).toBeVisible({ timeout: 10_000 });
  }
);

// ---------------------------------------------------------------------------
// When — download
// ---------------------------------------------------------------------------

When(
  'I click to download {string}',
  async ({ authedPage }, fileName: string) => {
    const downloadPromise = authedPage.waitForEvent('download');
    await authedPage.getByRole('link', { name: fileName }).click();
    (authedPage as any)._lastDownload = await downloadPromise;
  }
);

Then(
  'the download filename should contain {string}',
  async ({ authedPage }, expectedSubstring: string) => {
    const download = (authedPage as any)._lastDownload;
    expect(download.suggestedFilename()).toContain(expectedSubstring);
  }
);
