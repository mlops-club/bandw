/**
 * Step definitions for reports/advanced feature files.
 *
 * Reuses: common.steps.ts, project-page.steps.ts, line-plot.steps.ts,
 *         reports-core.steps.ts
 */
import { expect } from '@playwright/test';
import { Given, When, Then } from '../../../../steps/fixtures';

// ---------------------------------------------------------------------------
// When — report navigation
// ---------------------------------------------------------------------------

When(
  'I click the first report link',
  async ({ authedPage }) => {
    await authedPage.getByRole('link', { name: /report/i }).first().click();
  }
);

When(
  'I click the share button',
  async ({ authedPage }) => {
    await authedPage.getByRole('button', { name: /share/i }).click();
  }
);

When(
  'I click the edit button',
  async ({ authedPage }) => {
    await authedPage.getByRole('button', { name: /edit/i }).click();
  }
);

When(
  'I type draft content',
  async ({ authedPage }) => {
    await authedPage.keyboard.type('Draft edit test content');
  }
);

When(
  'I click save to report',
  async ({ authedPage }) => {
    await authedPage.getByRole('button', { name: /save to report/i }).click();
  }
);

// ---------------------------------------------------------------------------
// Then — share modal assertions
// ---------------------------------------------------------------------------

Then(
  'I should see an invite input field',
  async ({ authedPage }) => {
    await expect(
      authedPage.getByRole('textbox', { name: /email|invite|username/i })
    ).toBeVisible({ timeout: 10_000 });
  }
);

Then(
  'I should see permission options',
  async ({ authedPage }) => {
    await expect(
      authedPage.getByRole('combobox', { name: /permission/i })
        .or(authedPage.getByText(/can view|can edit/i).first())
    ).toBeVisible({ timeout: 10_000 });
  }
);

Then(
  'I should see a shareable link control',
  async ({ authedPage }) => {
    await expect(
      authedPage.getByRole('textbox', { name: /link/i })
        .or(authedPage.getByText(/copy link/i))
    ).toBeVisible({ timeout: 10_000 });
  }
);

// ---------------------------------------------------------------------------
// When — comments
// ---------------------------------------------------------------------------

When(
  'I click the comment button',
  async ({ authedPage }) => {
    await authedPage.getByRole('button', { name: /comment/i }).click();
  }
);

When(
  'I fill in the comment text',
  async ({ authedPage }) => {
    await authedPage
      .getByRole('textbox', { name: /comment/i })
      .fill('This is a report-level comment');
  }
);

When(
  'I submit the comment',
  async ({ authedPage }) => {
    await authedPage.keyboard.press('Enter');
  }
);

// ---------------------------------------------------------------------------
// When — star
// ---------------------------------------------------------------------------

When(
  'I click the star button',
  async ({ authedPage }) => {
    await authedPage.getByRole('button', { name: /star/i }).first().click();
  }
);

Then(
  'I should see a starred indicator',
  async ({ authedPage }) => {
    await expect(
      authedPage.getByRole('button', { name: /unstar|starred/i }).first()
        .or(authedPage.locator('[aria-pressed="true"]').first())
    ).toBeVisible({ timeout: 10_000 });
  }
);

When(
  'I click the unstar button',
  async ({ authedPage }) => {
    await authedPage.getByRole('button', { name: /unstar|star/i }).first().click();
  }
);

// ---------------------------------------------------------------------------
// Then — advanced report run names
// ---------------------------------------------------------------------------

Then(
  'I should see a run name in the advanced report',
  async ({ authedPage }) => {
    await expect(
      authedPage.getByText(/basic-run/i).or(authedPage.getByText(/train-alpha/i)).first()
    ).toBeVisible({ timeout: 10_000 });
  }
);

// ---------------------------------------------------------------------------
// When — clone
// ---------------------------------------------------------------------------

When(
  'I click the report actions menu',
  async ({ authedPage }) => {
    await authedPage.getByRole('button', { name: /more|actions|menu|\.\.\./i }).click();
  }
);

When(
  'I click the clone option',
  async ({ authedPage }) => {
    await authedPage.getByRole('menuitem', { name: /clone/i }).click();
  }
);

When(
  'I click the clone confirm button',
  async ({ authedPage }) => {
    await authedPage.getByRole('button', { name: /clone|confirm|create/i }).click();
  }
);

Then(
  'I should see clone confirmation',
  async ({ authedPage }) => {
    await expect(authedPage.getByText(/clone|copy/i)).toBeVisible({ timeout: 10_000 });
  }
);

// ---------------------------------------------------------------------------
// When — export
// ---------------------------------------------------------------------------

When(
  'I click the download option',
  async ({ authedPage }) => {
    await authedPage.getByRole('menuitem', { name: /download|export/i }).click();
  }
);

Then(
  'I should see PDF option',
  async ({ authedPage }) => {
    await expect(authedPage.getByText(/pdf/i)).toBeVisible({ timeout: 10_000 });
  }
);

When(
  'I click PDF and download',
  async ({ authedPage }) => {
    const downloadPromise = authedPage.waitForEvent('download');
    await authedPage.getByText(/pdf/i).click();
    (authedPage as any)._lastDownload = await downloadPromise;
  }
);

Then(
  'the downloaded file should be a PDF',
  async ({ authedPage }) => {
    const download = (authedPage as any)._lastDownload;
    expect(download.suggestedFilename()).toMatch(/\.pdf$/);
  }
);

// ---------------------------------------------------------------------------
// When — send panel to report
// ---------------------------------------------------------------------------

When(
  'I click the first panel actions menu',
  async ({ authedPage }) => {
    await authedPage
      .locator('[class*="panel"]')
      .first()
      .getByRole('button', { name: /more|menu|\.\.\./i })
      .click();
  }
);

When(
  'I click add to report',
  async ({ authedPage }) => {
    await authedPage.getByRole('menuitem', { name: /add to report/i }).click();
  }
);

Then(
  'I should see a report selector',
  async ({ authedPage }) => {
    await expect(
      authedPage.getByRole('dialog')
        .or(authedPage.getByRole('combobox', { name: /report/i }))
    ).toBeVisible({ timeout: 10_000 });
  }
);
