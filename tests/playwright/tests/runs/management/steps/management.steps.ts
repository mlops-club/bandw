/**
 * Step definitions for runs/management feature files.
 *
 * Reused from other step files (globally loaded):
 * - steps/common.steps.ts: SDK setup, a run named, open run overview page, I should see
 * - tests/track/project-page/steps/project-page.steps.ts: navigate to project table page,
 *     wait for table to load, first run name visible, checkbox in table
 * - tests/track/workspaces/steps/workspaces.steps.ts: click Filter/Group button
 * - tests/runs/compare/steps/compare.steps.ts: second run name visible
 *
 * Only steps unique to runs/management are defined here.
 */
import { expect } from '@playwright/test';
import { Given, When, Then } from '../../../../steps/fixtures';

// ---------------------------------------------------------------------------
// Then — run overview assertions
// ---------------------------------------------------------------------------

Then(
  'I should see overview content',
  async ({ authedPage }) => {
    await expect(
      authedPage.getByText(/Overview|State|Created|Tags/i).first()
    ).toBeVisible({ timeout: 10_000 });
  }
);

Then(
  'I should see the current run name',
  async ({ authedPage, sdkData }) => {
    const run = (sdkData as any)._currentRun ?? sdkData.runs[0];
    const runName = run.displayName || run.name;
    // Run name may be in a heading or other element — use a broader locator
    await expect(
      authedPage.getByRole('heading', { name: runName })
        .or(authedPage.getByText(runName).first())
    ).toBeVisible({ timeout: 15_000 });
  }
);

Then(
  'I should see tags or tag content on the overview',
  async ({ authedPage }) => {
    await expect(
      authedPage.getByText(/Tags|tag|baseline|v1/i).first()
    ).toBeVisible({ timeout: 10_000 });
  }
);

// ---------------------------------------------------------------------------
// Then — table toolbar assertions
// ---------------------------------------------------------------------------

Then(
  'the Group button should be visible',
  async ({ authedPage }) => {
    await expect(
      authedPage.getByRole('button', { name: /Group/i }).first()
    ).toBeVisible({ timeout: 10_000 });
  }
);

Then(
  'the Filter button should be visible',
  async ({ authedPage }) => {
    await expect(
      authedPage.getByRole('button', { name: /Filter/i }).first()
    ).toBeVisible({ timeout: 10_000 });
  }
);

// ---------------------------------------------------------------------------
// Then — state badge assertions
// ---------------------------------------------------------------------------

Then(
  'I should see a state badge in the table',
  async ({ authedPage }) => {
    await expect(
      authedPage.getByText(/Finished|Crashed|Running/i).first()
    ).toBeVisible({ timeout: 10_000 });
  }
);

Then(
  'I should see a state badge on the overview',
  async ({ authedPage }) => {
    await expect(
      authedPage.getByText(/Finished|Crashed|Running/i).first()
    ).toBeVisible({ timeout: 10_000 });
  }
);
