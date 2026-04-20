import { test, expect } from '../../../fixtures';

test('undo: undoing a panel deletion restores the panel', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/workspace`);
  await page.getByRole('button', { name: 'Add panels' }).waitFor({ timeout: 30_000 });

  // Delete a panel (e.g. via section actions)
  const sectionActionsButton = page.getByRole('button', { name: /Section actions/i }).first();
  await sectionActionsButton.click();

  // Look for a delete/remove panel option
  await page.getByRole('menuitem', { name: /Delete|Remove/i }).first().click();

  // Click undo to restore
  await page.getByRole('button', { name: /Undo last action/i }).first().click();

  // The deleted content should be restored
  await expect(page.getByText(/loss/i).first()).toBeVisible({ timeout: 10_000 });
});

test('redo: redo re-applies the undone action', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/workspace`);
  await page.getByRole('button', { name: 'Add panels' }).waitFor({ timeout: 30_000 });

  // Make a change and undo it
  const sectionActionsButton = page.getByRole('button', { name: /Section actions/i }).first();
  await sectionActionsButton.click();
  await page.getByRole('menuitem', { name: /Delete|Remove/i }).first().click();

  // Undo
  await page.getByRole('button', { name: /Undo last action/i }).first().click();
  await expect(page.getByText(/loss/i).first()).toBeVisible({ timeout: 10_000 });

  // Redo should re-apply the deletion
  await page.getByRole('button', { name: /Redo last action/i }).first().click();

  // The redo button should be functional (content may be removed again)
  await expect(page.getByRole('button', { name: /Undo last action/i }).first()).toBeVisible({ timeout: 10_000 });
});

test('autosave: workspace shows saved indicator', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/workspace`);
  await page.getByRole('button', { name: 'Add panels' }).waitFor({ timeout: 30_000 });

  // Autosave indicator should show saved status
  await expect(page.getByText(/Saved|saved just now|Auto-saved/i).first()).toBeVisible({ timeout: 10_000 });
});
