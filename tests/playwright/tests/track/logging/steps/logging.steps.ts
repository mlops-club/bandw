/**
 * Step definitions specific to the track/logging feature area.
 *
 * Reusable steps live in steps/common.steps.ts; these cover
 * logging-specific assertions (section expansion, panel rendering, etc.).
 *
 * Steps reused from other areas:
 *   - "I scroll to the bottom of the page" — from steps/common.steps.ts
 *   - "the summary section should show {string}" — from steps/common.steps.ts
 */
import { expect } from '@playwright/test';
import { Given, When, Then } from '../../../../steps/fixtures';

// ---------------------------------------------------------------------------
// When — section expansion
// ---------------------------------------------------------------------------

When(
  'I expand the {string} section if collapsed',
  async ({ authedPage }, sectionName: string) => {
    const expandBtn = authedPage.getByRole('button', {
      name: new RegExp(`Expand ${sectionName}`, 'i'),
    });
    if (await expandBtn.isVisible().catch(() => false)) {
      await expandBtn.click();
      await authedPage.waitForTimeout(1000);
    }
  }
);

// ---------------------------------------------------------------------------
// When — wait for panels to render (async chart loading)
// ---------------------------------------------------------------------------

When(
  'I wait for chart panels to render',
  async ({ authedPage }) => {
    await authedPage.waitForTimeout(2000);
  }
);

// ---------------------------------------------------------------------------
// Then — verify text appears on the page (first match)
// NOTE: 'I should see {string} on the page' is defined in artifacts-core.steps.ts
// ---------------------------------------------------------------------------
