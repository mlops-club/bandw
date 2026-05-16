/**
 * Step definitions for reports/core feature files.
 *
 * Reuses: common.steps.ts, project-page.steps.ts, line-plot.steps.ts
 */
import { expect } from '@playwright/test';
import { Given, When, Then } from '../../../../steps/fixtures';

// ---------------------------------------------------------------------------
// When — report creation
// ---------------------------------------------------------------------------

When(
  'I click the create report button',
  async ({ authedPage }) => {
    await authedPage.getByRole('button', { name: /create report/i }).click();
  }
);

When(
  'I click the create report button on reports page',
  async ({ authedPage }) => {
    await authedPage.getByRole('button', { name: /create report/i }).click();
  }
);

When(
  'I toggle filter run sets',
  async ({ authedPage }) => {
    await authedPage.getByRole('checkbox', { name: /filter run sets/i }).click();
  }
);

When(
  'I click the create report confirm button',
  async ({ authedPage }) => {
    await authedPage.getByRole('button', { name: /create report/i }).click();
  }
);

// ---------------------------------------------------------------------------
// Then — report assertions
// ---------------------------------------------------------------------------

Then(
  'I should see a dialog',
  async ({ authedPage }) => {
    await expect(authedPage.getByRole('dialog')).toBeVisible({ timeout: 10_000 });
  }
);

Then(
  'I should see report content',
  async ({ authedPage }) => {
    await expect(authedPage.getByText(/report/i)).toBeVisible({ timeout: 10_000 });
  }
);

Then(
  'I should see a report editor',
  async ({ authedPage }) => {
    await expect(
      authedPage.getByRole('textbox', { name: /title/i })
        .or(authedPage.locator('[contenteditable]').first())
    ).toBeVisible({ timeout: 10_000 });
  }
);

Then(
  'I should see a report link',
  async ({ authedPage }) => {
    await expect(
      authedPage.getByRole('link', { name: /report/i }).first()
    ).toBeVisible({ timeout: 10_000 });
  }
);

// ---------------------------------------------------------------------------
// When — slash commands
// ---------------------------------------------------------------------------

When(
  'I type a slash command',
  async ({ authedPage }) => {
    await authedPage.keyboard.press('/');
  }
);

Then(
  'I should see a line plot option',
  async ({ authedPage }) => {
    await expect(
      authedPage.getByRole('option', { name: /line plot/i })
        .or(authedPage.getByRole('menuitem', { name: /line plot/i }))
        .or(authedPage.getByText(/line plot/i))
    ).toBeVisible({ timeout: 10_000 });
  }
);

When(
  'I click the line plot option',
  async ({ authedPage }) => {
    await authedPage.getByText(/line plot/i).click();
  }
);

Then(
  'I should see a panel element',
  async ({ authedPage }) => {
    await expect(
      authedPage.locator('[class*="panel"]').or(authedPage.getByText(/line plot/i))
    ).toBeVisible({ timeout: 10_000 });
  }
);

When(
  'I click the panel grid option',
  async ({ authedPage }) => {
    await authedPage.getByText(/panel grid/i).click();
  }
);

Then(
  'I should see a run name in the report',
  async ({ authedPage }) => {
    await expect(
      authedPage.getByText(/experiment-A/i).or(authedPage.getByText(/basic-run/i)).first()
    ).toBeVisible({ timeout: 10_000 });
  }
);

When(
  'I click the freeze button',
  async ({ authedPage }) => {
    await authedPage.getByRole('button', { name: /freeze/i }).click();
  }
);

Then(
  'I should see a frozen indicator',
  async ({ authedPage }) => {
    await expect(
      authedPage.getByRole('button', { name: /frozen|unfreeze/i })
        .or(authedPage.locator('[aria-label*="frozen"]'))
    ).toBeVisible({ timeout: 10_000 });
  }
);

When(
  'I click the code option',
  async ({ authedPage }) => {
    await authedPage.getByText(/code/i).click();
  }
);

When(
  'I click the Python language option',
  async ({ authedPage }) => {
    await authedPage.getByText(/python/i).click();
  }
);

When(
  'I type code content',
  async ({ authedPage }) => {
    await authedPage.keyboard.type('import wandb\nrun = wandb.init()');
  }
);

When(
  'I click the markdown option',
  async ({ authedPage }) => {
    await authedPage.getByText(/markdown/i).click();
  }
);

When(
  'I type markdown content',
  async ({ authedPage }) => {
    await authedPage.keyboard.type('**bold text** and *italic text*');
  }
);

When(
  'I click the heading 2 option',
  async ({ authedPage }) => {
    await authedPage.getByText(/heading 2/i).click();
  }
);

When(
  'I type {string}',
  async ({ authedPage }, text: string) => {
    await authedPage.keyboard.type(text);
  }
);

Then(
  'I should see a heading named {string}',
  async ({ authedPage }, headingText: string) => {
    await expect(
      authedPage.getByRole('heading', { name: headingText })
    ).toBeVisible({ timeout: 10_000 });
  }
);

When(
  'I press Enter and type paragraph text',
  async ({ authedPage }) => {
    await authedPage.keyboard.press('Enter');
    await authedPage.keyboard.type('This section contains our findings.');
  }
);
