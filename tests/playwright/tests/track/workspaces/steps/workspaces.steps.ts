/**
 * Step definitions specific to the track/workspaces feature area.
 *
 * Reusable steps live in steps/common.steps.ts; these cover
 * workspace-specific UI interactions: saved views, settings panel,
 * filter/group/sort toolbar, panel sections, runs sidebar, undo/redo.
 */
import { expect } from '@playwright/test';
import { Given, When, Then } from '../../../../steps/fixtures';

// ===========================================================================
// Saved Views
// ===========================================================================

When(
  'I open the workspace actions menu',
  async ({ authedPage }) => {
    await authedPage.getByRole('button', { name: /Workspace actions/i }).click();
  }
);

When(
  'I click {string}',
  async ({ authedPage }, itemText: string) => {
    await authedPage.getByRole('menuitem', { name: new RegExp(itemText, 'i') }).click();
  }
);

Then(
  'I should see a view name input',
  async ({ authedPage }) => {
    await expect(
      authedPage.getByRole('textbox', { name: /view name/i })
    ).toBeVisible({ timeout: 10_000 });
  }
);

When(
  'I fill the view name with {string}',
  async ({ authedPage }, name: string) => {
    const input = authedPage.getByRole('textbox', { name: /view name/i });
    await input.fill(name);
  }
);

When(
  'I click the Save button',
  async ({ authedPage }) => {
    await authedPage.getByRole('button', { name: /Save/i }).click();
  }
);

Then(
  'I should see {string} in the workspace navigation',
  async ({ authedPage }, text: string) => {
    await expect(
      authedPage.getByText(text).first()
    ).toBeVisible({ timeout: 10_000 });
  }
);

When(
  'I create a saved view named {string}',
  async ({ authedPage }, viewName: string) => {
    await authedPage.getByRole('button', { name: /Workspace actions/i }).click();
    await authedPage.getByRole('menuitem', { name: /Save as a new view/i }).click();
    const input = authedPage.getByRole('textbox', { name: /view name/i });
    await input.fill(viewName);
    await authedPage.getByRole('button', { name: /Save/i }).click();
    await expect(authedPage.getByText(viewName).first()).toBeVisible({ timeout: 10_000 });
  }
);

// "I navigate to the project table page" is defined in project-page.steps.ts

When(
  'I click {string} in navigation',
  async ({ authedPage }, text: string) => {
    await authedPage.getByText(text).first().click();
  }
);

Then(
  'the workspace should load with panels visible',
  async ({ authedPage }) => {
    await authedPage.getByRole('button', { name: 'Add panels' }).waitFor({ timeout: 30_000 });
  }
);

When(
  'I click the save menuitem',
  async ({ authedPage }) => {
    await authedPage.getByRole('menuitem', { name: /Save/i }).click();
  }
);

Then(
  'I should see a save confirmation button',
  async ({ authedPage }) => {
    await expect(
      authedPage.getByRole('button', { name: /Save|Confirm/i }).first()
    ).toBeVisible({ timeout: 10_000 });
  }
);

When(
  'I confirm the deletion',
  async ({ authedPage }) => {
    await authedPage.getByRole('button', { name: /Delete|Confirm/i }).first().click();
  }
);

Then(
  '{string} should not be visible',
  async ({ authedPage }, text: string) => {
    await expect(authedPage.getByText(text)).not.toBeVisible({ timeout: 10_000 });
  }
);

// ===========================================================================
// Workspace Settings
// ===========================================================================

When(
  'I open workspace settings',
  async ({ authedPage }) => {
    // Wait for workspace to fully load before interacting with settings
    await authedPage.getByRole('button', { name: 'Add panels' }).waitFor({ timeout: 30_000 });
    await authedPage.getByRole('button', { name: /Workspace settings/i }).first().click();
    await authedPage.waitForTimeout(1000);
  }
);

Then(
  'I should see settings content',
  async ({ authedPage }) => {
    await expect(authedPage.getByText(/settings/i).first()).toBeVisible({ timeout: 10_000 });
  }
);

Then(
  'the hide empty sections toggle should be visible',
  async ({ authedPage }) => {
    const toggle = authedPage
      .getByRole('switch', { name: /Hide empty sections/i })
      .or(authedPage.getByRole('checkbox', { name: /Hide empty sections/i }))
      .or(authedPage.getByLabel(/Hide empty sections/i));
    await expect(toggle.first()).toBeVisible({ timeout: 10_000 });
  }
);

Then(
  'the sort panels alphabetically toggle should be visible',
  async ({ authedPage }) => {
    const toggle = authedPage
      .getByRole('switch', { name: /Sort panels alphabetically/i })
      .or(authedPage.getByRole('checkbox', { name: /Sort panels alphabetically/i }))
      .or(authedPage.getByLabel(/Sort panels alphabetically/i));
    await expect(toggle.first()).toBeVisible({ timeout: 10_000 });
  }
);

Then(
  'I should see {string} in settings',
  async ({ authedPage }, text: string) => {
    await expect(authedPage.getByText(new RegExp(text, 'i')).first()).toBeVisible({ timeout: 10_000 });
  }
);

// ===========================================================================
// Filter / Group / Sort / Columns
// ===========================================================================

When(
  'I click the Filter button',
  async ({ authedPage }) => {
    await authedPage.getByRole('button', { name: /Filter/i }).first().click();
  }
);

When(
  'I click the Group button',
  async ({ authedPage }) => {
    await authedPage.getByRole('button', { name: /Group/i }).first().click();
  }
);

When(
  'I click the Sort button',
  async ({ authedPage }) => {
    await authedPage.getByRole('button', { name: /Sort/i }).first().click();
  }
);

Then(
  'the sort controls should be visible',
  async ({ authedPage }) => {
    // Sort label may vary ("Sort runs by..." or "Sort by:")
    await expect(
      authedPage.getByText(/Sort\s+(runs\s+)?by/i).first()
    ).toBeVisible({ timeout: 10_000 });
  }
);

Then(
  'I should see an add filter button',
  async ({ authedPage }) => {
    await expect(
      authedPage.getByRole('button', { name: /Add filter|New filter/i }).first()
    ).toBeVisible({ timeout: 10_000 });
  }
);

Then(
  'all three runs should be visible',
  async ({ authedPage, sdkData }) => {
    for (const run of sdkData.runs) {
      const name = run.displayName || run.name;
      await expect(authedPage.getByText(name).first()).toBeVisible({ timeout: 10_000 });
    }
  }
);

When(
  'I click the add filter button',
  async ({ authedPage }) => {
    await authedPage.getByRole('button', { name: /Add filter|New filter/i }).first().click();
  }
);

Then(
  'I should see filter UI',
  async ({ authedPage }) => {
    await expect(authedPage.getByText(/filter/i).first()).toBeVisible({ timeout: 10_000 });
  }
);

Then(
  'I should see group UI',
  async ({ authedPage }) => {
    await expect(authedPage.getByText(/group/i).first()).toBeVisible({ timeout: 10_000 });
  }
);

When(
  'I select {string} in the group picker',
  async ({ authedPage }, column: string) => {
    await authedPage.getByText(column).first().click();
  }
);

Then(
  'I should see {string} group',
  async ({ authedPage }, groupName: string) => {
    await expect(
      authedPage.getByText(new RegExp(groupName)).first()
    ).toBeVisible({ timeout: 10_000 });
  }
);

// "I click the Sort button" is defined in project-page.steps.ts

Then(
  'I should see sort UI',
  async ({ authedPage }) => {
    await expect(authedPage.getByText(/sort/i).first()).toBeVisible({ timeout: 10_000 });
  }
);

When(
  'I select {string} in the sort picker',
  async ({ authedPage }, column: string) => {
    await authedPage.getByText(new RegExp(column)).first().click();
  }
);

Then(
  'the first run should still be visible',
  async ({ authedPage, sdkData }) => {
    const name = sdkData.runs[0].displayName || sdkData.runs[0].name;
    await expect(authedPage.getByText(name).first()).toBeVisible({ timeout: 10_000 });
  }
);

When(
  'I click the Columns button',
  async ({ authedPage }) => {
    await authedPage.getByRole('button', { name: /Columns/i }).first().click();
  }
);

Then(
  'I should see column picker UI',
  async ({ authedPage }) => {
    await expect(authedPage.getByText(/column/i).first()).toBeVisible({ timeout: 10_000 });
  }
);

// ===========================================================================
// Panel Sections
// ===========================================================================

Then(
  'I should see section collapse buttons',
  async ({ authedPage }) => {
    await expect(
      authedPage.getByRole('button', { name: /Collapse.*section|Expand.*section/i }).first()
    ).toBeVisible({ timeout: 10_000 });
  }
);

Then(
  'I should see a {string} section',
  async ({ authedPage }, sectionName: string) => {
    await expect(
      authedPage.getByText(new RegExp(sectionName, 'i')).first()
    ).toBeVisible({ timeout: 10_000 });
  }
);

When(
  'I click the first collapse section button',
  async ({ authedPage }) => {
    await authedPage
      .getByRole('button', { name: /Collapse.*section/i })
      .first()
      .click();
  }
);

Then(
  'I should see an expand section button',
  async ({ authedPage }) => {
    await expect(
      authedPage.getByRole('button', { name: /Expand.*section/i }).first()
    ).toBeVisible({ timeout: 10_000 });
  }
);

Then(
  'I should see a panel count badge',
  async ({ authedPage }) => {
    await expect(
      authedPage
        .getByText(/\d+\s*panel/i)
        .or(authedPage.getByText(/\(\d+\)/))
        .first()
    ).toBeVisible({ timeout: 10_000 });
  }
);

When(
  'I search panels for {string}',
  async ({ authedPage }, query: string) => {
    const input = authedPage.getByPlaceholder(/Search panels/i);
    await input.fill(query);
  }
);

Then(
  'I should see {string} in results',
  async ({ authedPage }, text: string) => {
    await expect(
      authedPage.getByText(new RegExp(text, 'i')).first()
    ).toBeVisible({ timeout: 10_000 });
  }
);

Then(
  'I should see a section settings button',
  async ({ authedPage }) => {
    await expect(
      authedPage.getByRole('button', { name: /Section settings/i }).first()
    ).toBeVisible({ timeout: 10_000 });
  }
);

Then(
  'I should see {string} in the panels area',
  async ({ authedPage }, text: string) => {
    await expect(
      authedPage.getByText(new RegExp(text, 'i')).first()
    ).toBeVisible({ timeout: 10_000 });
  }
);

Then(
  'I should see a pin section button',
  async ({ authedPage }) => {
    await expect(
      authedPage.getByRole('button', { name: /Pin section/i }).first()
    ).toBeVisible({ timeout: 10_000 });
  }
);

// ===========================================================================
// Runs Sidebar
// ===========================================================================

Then(
  'I should see a runs count badge',
  async ({ authedPage }) => {
    await expect(
      authedPage.getByText(/Runs\s*\(?\d+\)?/).first()
    ).toBeVisible({ timeout: 10_000 });
  }
);

Then(
  'the first run should be visible in the sidebar',
  async ({ authedPage, sdkData }) => {
    const name = sdkData.runs[0].displayName || sdkData.runs[0].name;
    await expect(authedPage.getByText(name).first()).toBeVisible({ timeout: 10_000 });
  }
);

Then(
  'the second run should not be visible',
  async ({ authedPage, sdkData }) => {
    const name = sdkData.runs[1].displayName || sdkData.runs[1].name;
    await expect(authedPage.getByText(name)).not.toBeVisible({ timeout: 10_000 });
  }
);

Then(
  'the third run should be visible in the sidebar',
  async ({ authedPage, sdkData }) => {
    const name = sdkData.runs[2].displayName || sdkData.runs[2].name;
    await expect(authedPage.getByText(name).first()).toBeVisible({ timeout: 10_000 });
  }
);

Then(
  'the first run should not be visible in the sidebar',
  async ({ authedPage, sdkData }) => {
    const name = sdkData.runs[0].displayName || sdkData.runs[0].name;
    await expect(authedPage.getByText(name)).not.toBeVisible({ timeout: 10_000 });
  }
);

When(
  'I click the visibility toggle',
  async ({ authedPage }) => {
    await authedPage
      .getByRole('button', { name: /toggle.*visibility|hide.*run|show.*run/i })
      .first()
      .click();
  }
);

Then(
  'the visibility toggle should still be present',
  async ({ authedPage }) => {
    await expect(
      authedPage.getByRole('button', { name: /toggle.*visibility|hide.*run|show.*run/i }).first()
    ).toBeVisible({ timeout: 10_000 });
  }
);

When(
  'I click a run color button',
  async ({ authedPage }) => {
    await authedPage.getByRole('button', { name: /color|swatch/i }).first().click();
  }
);

Then(
  'I should see a color picker dialog',
  async ({ authedPage }) => {
    await expect(
      authedPage.getByRole('dialog').or(authedPage.getByRole('listbox')).first()
    ).toBeVisible({ timeout: 10_000 });
  }
);

When(
  'I search runs for {string}',
  async ({ authedPage }, query: string) => {
    const searchBox = authedPage
      .getByRole('combobox', { name: /Search runs/i })
      .or(authedPage.getByPlaceholder(/Search runs/i));
    await searchBox.first().fill(query);
  }
);

When(
  'I enable regex search mode',
  async ({ authedPage }) => {
    await authedPage.getByRole('button', { name: /regex/i }).first().click();
  }
);

When(
  'I click the first run link',
  async ({ authedPage, sdkData }) => {
    const name = sdkData.runs[0].displayName || sdkData.runs[0].name;
    await authedPage.getByRole('link', { name: new RegExp(name) }).first().click();
  }
);

Then(
  'the URL should contain {string}',
  async ({ authedPage }, urlPart: string) => {
    await expect(authedPage).toHaveURL(new RegExp(urlPart));
  }
);

When(
  'I click the expand sidebar button',
  async ({ authedPage }) => {
    await authedPage.getByRole('button', { name: /expand|full table/i }).first().click();
  }
);

Then(
  'I should see a runs table',
  async ({ authedPage }) => {
    await expect(authedPage.getByRole('table').first()).toBeVisible({ timeout: 10_000 });
  }
);

When(
  'I press the sidebar toggle shortcut',
  async ({ authedPage }) => {
    const modifier = process.platform === 'darwin' ? 'Meta' : 'Control';
    await authedPage.keyboard.press(`${modifier}+.`);
  }
);

// ===========================================================================
// Workspace Types
// ===========================================================================

Then(
  'I should see {string} badge',
  async ({ authedPage }, text: string) => {
    await expect(
      authedPage.getByText(new RegExp(text, 'i')).first()
    ).toBeVisible({ timeout: 10_000 });
  }
);

When(
  'I open the named workspace menu',
  async ({ authedPage }) => {
    await authedPage.getByRole('button', { name: /Toggle named workspace menu/i }).click();
  }
);

Then(
  'I should see a workspace name input',
  async ({ authedPage }) => {
    await expect(
      authedPage.getByRole('textbox', { name: /workspace name/i }).first()
    ).toBeVisible({ timeout: 10_000 });
  }
);

When(
  'I fill the workspace name with {string}',
  async ({ authedPage }, name: string) => {
    const input = authedPage.getByRole('textbox', { name: /workspace name/i }).first();
    await input.fill(name);
  }
);

Then(
  'the workspace name input should have value {string}',
  async ({ authedPage }, value: string) => {
    await expect(
      authedPage.getByRole('textbox', { name: /workspace name/i }).first()
    ).toHaveValue(value);
  }
);

// ===========================================================================
// Undo / Redo
// ===========================================================================

When(
  'I open section actions and delete',
  async ({ authedPage }) => {
    await authedPage.getByRole('button', { name: /Section actions/i }).first().click();
    await authedPage.getByRole('menuitem', { name: /Delete|Remove/i }).first().click();
  }
);

When(
  'I click the undo button',
  async ({ authedPage }) => {
    await authedPage.getByRole('button', { name: /Undo last action/i }).first().click();
  }
);

When(
  'I click the redo button',
  async ({ authedPage }) => {
    await authedPage.getByRole('button', { name: /Redo last action/i }).first().click();
  }
);

Then(
  'the undo button should still be visible',
  async ({ authedPage }) => {
    await expect(
      authedPage.getByRole('button', { name: /Undo last action/i }).first()
    ).toBeVisible({ timeout: 10_000 });
  }
);

Then(
  'I should see a saved status indicator',
  async ({ authedPage }) => {
    await expect(
      authedPage.getByText(/Saved|saved just now|Auto-saved/i).first()
    ).toBeVisible({ timeout: 10_000 });
  }
);
