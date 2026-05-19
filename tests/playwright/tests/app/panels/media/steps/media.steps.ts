/**
 * Step definitions for app/panels/media feature files.
 *
 * Reuses: common.steps.ts, line-plot.steps.ts (workspace load, Add panels)
 */
import { expect } from '@playwright/test';
import { Given, When, Then } from '../../../../../steps/fixtures';

// ---------------------------------------------------------------------------
// Then — media type assertions
// ---------------------------------------------------------------------------

Then(
  'I should see image content in the workspace',
  async ({ authedPage }) => {
    await expect(
      authedPage.getByRole('img', { name: /images/i }).first()
        .or(authedPage.getByText(/images/i).first())
    ).toBeVisible({ timeout: 10_000 });
  }
);

Then(
  'I should see a slider control',
  async ({ authedPage }) => {
    await expect(authedPage.getByRole('slider').first()).toBeVisible({ timeout: 10_000 });
  }
);

Then(
  'I should see a step caption',
  async ({ authedPage }) => {
    await expect(authedPage.getByText(/step-\d+-caption/)).toBeVisible({ timeout: 10_000 });
  }
);

Then(
  'I should see mask content',
  async ({ authedPage }) => {
    await expect(authedPage.getByText(/masks/i).first()).toBeVisible({ timeout: 10_000 });
  }
);

Then(
  'I should see a class label',
  async ({ authedPage }) => {
    await expect(
      authedPage.getByText(/cat/i).first().or(authedPage.getByText(/dog/i).first())
    ).toBeVisible({ timeout: 10_000 });
  }
);

Then(
  'I should see bounding box content',
  async ({ authedPage }) => {
    await expect(
      authedPage.getByText(/boxes/i).first()
        .or(authedPage.getByText(/bounding/i).first())
    ).toBeVisible({ timeout: 10_000 });
  }
);

Then(
  'I should see overlay table content',
  async ({ authedPage }) => {
    await expect(
      authedPage.getByText(/overlay_table/i).first()
    ).toBeVisible({ timeout: 10_000 });
  }
);

Then(
  'I should see histogram content',
  async ({ authedPage }) => {
    await expect(authedPage.getByText(/histogram/i).first()).toBeVisible({ timeout: 10_000 });
  }
);

Then(
  'I should see audio content',
  async ({ authedPage }) => {
    await expect(authedPage.getByText(/audio/i).first()).toBeVisible({ timeout: 10_000 });
  }
);

Then(
  'I should see an audio caption',
  async ({ authedPage }) => {
    await expect(authedPage.getByText(/tone-\d/i).first()).toBeVisible({ timeout: 10_000 });
  }
);

Then(
  'I should see video content',
  async ({ authedPage }) => {
    await expect(authedPage.getByText(/video/i).first()).toBeVisible({ timeout: 10_000 });
  }
);

Then(
  'I should see point cloud or 3D content',
  async ({ authedPage }) => {
    await expect(
      authedPage.getByText(/point_cloud/i).first()
        .or(authedPage.getByText(/object3d/i).first())
    ).toBeVisible({ timeout: 10_000 });
  }
);

Then(
  'I should see HTML content',
  async ({ authedPage }) => {
    await expect(
      authedPage.getByText(/html_content/i).first()
    ).toBeVisible({ timeout: 10_000 });
  }
);

When(
  'I click the Add panels button',
  async ({ authedPage }) => {
    await authedPage.getByRole('button', { name: 'Add panels' }).click();
  }
);

Then(
  'I should see a panel dialog',
  async ({ authedPage }) => {
    await expect(
      authedPage.getByRole('dialog').or(authedPage.getByText(/panel/i)).first()
    ).toBeVisible({ timeout: 10_000 });
  }
);

Then(
  'I should see the primary media run name',
  async ({ authedPage }) => {
    await expect(
      authedPage.getByText(/media-primary/i).first()
    ).toBeVisible({ timeout: 10_000 });
  }
);

Then(
  'I should see the secondary media run name',
  async ({ authedPage }) => {
    await expect(
      authedPage.getByText(/media-run-1/i).first()
    ).toBeVisible({ timeout: 10_000 });
  }
);
