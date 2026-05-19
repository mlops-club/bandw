/**
 * Step definitions for app/keyboard-shortcuts feature files.
 *
 * Reuses: common.steps.ts, line-plot.steps.ts, project-page.steps.ts
 */
import { expect } from '@playwright/test';
import { Given, When, Then } from '../../../../steps/fixtures';

// ---------------------------------------------------------------------------
// When — panel operations
// ---------------------------------------------------------------------------

When(
  'I open a panel menu',
  async ({ authedPage }) => {
    const panelButton = authedPage.getByRole('button', { name: /edit panel|panel menu/i }).first();
    await panelButton.click();
  }
);

When(
  'I click delete panel',
  async ({ authedPage }) => {
    await authedPage.getByRole('menuitem', { name: /delete|remove/i }).first().click();
  }
);

When(
  'I press undo shortcut',
  async ({ authedPage }) => {
    await authedPage.keyboard.press('Meta+z');
  }
);

When(
  'I press redo shortcut',
  async ({ authedPage }) => {
    await authedPage.keyboard.press('Meta+Shift+z');
  }
);

Then(
  'a panel menu button should be visible',
  async ({ authedPage }) => {
    await expect(
      authedPage.getByRole('button', { name: /edit panel|panel menu/i }).first()
    ).toBeVisible({ timeout: 10_000 });
  }
);

// ---------------------------------------------------------------------------
// When — navigation shortcuts
// ---------------------------------------------------------------------------

When(
  'I press toggle tab shortcut',
  async ({ authedPage }) => {
    await authedPage.keyboard.press('Meta+j');
  }
);

Then(
  'I should see a workspace or runs tab',
  async ({ authedPage }) => {
    await expect(
      authedPage.getByRole('tab', { name: /runs/i })
        .or(authedPage.getByRole('tab', { name: /workspace/i }))
    ).toBeVisible({ timeout: 10_000 });
  }
);

// ---------------------------------------------------------------------------
// Then — media shortcuts
// ---------------------------------------------------------------------------

Then(
  'I should see images or media content',
  async ({ authedPage }) => {
    await expect(
      authedPage.getByText(/images/i).first()
        .or(authedPage.getByText(/kbd-media/i))
    ).toBeVisible({ timeout: 10_000 });
  }
);

Then(
  'I should see a slider or step control',
  async ({ authedPage }) => {
    await expect(
      authedPage.getByRole('slider').first()
        .or(authedPage.getByText(/step/i).first())
    ).toBeVisible({ timeout: 10_000 });
  }
);
