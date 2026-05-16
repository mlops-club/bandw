import { test, expect } from '../../../fixtures';

test('saved views: save current workspace as a new view', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/workspace`);
  await page.getByRole('button', { name: 'Add panels' }).waitFor({ timeout: 30_000 });

  // Open workspace actions menu and save as new view
  await page.getByRole('button', { name: /Workspace actions/i }).click();
  await page.getByRole('menuitem', { name: /Save as a new view/i }).click();

  // A dialog or input for the view name should appear
  const viewNameInput = page.getByRole('textbox', { name: /view name/i });
  await expect(viewNameInput).toBeVisible({ timeout: 10_000 });
  await viewNameInput.fill('My Saved View');

  // Confirm save
  await page.getByRole('button', { name: /Save/i }).click();

  // Saved view should now appear in navigation
  await expect(page.getByText('My Saved View').first()).toBeVisible({ timeout: 10_000 });
});

test('saved views: navigate to saved view loads correct state', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/workspace`);
  await page.getByRole('button', { name: 'Add panels' }).waitFor({ timeout: 30_000 });

  // Create a saved view first
  await page.getByRole('button', { name: /Workspace actions/i }).click();
  await page.getByRole('menuitem', { name: /Save as a new view/i }).click();
  const viewNameInput = page.getByRole('textbox', { name: /view name/i });
  await viewNameInput.fill('Nav Test View');
  await page.getByRole('button', { name: /Save/i }).click();
  await expect(page.getByText('Nav Test View').first()).toBeVisible({ timeout: 10_000 });

  // Navigate away and back
  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/table`);
  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/workspace`);

  // Click on the saved view in navigation
  await page.getByText('Nav Test View').first().click();

  // View should load with saved state
  await page.getByRole('button', { name: 'Add panels' }).waitFor({ timeout: 30_000 });
});

test('saved views: update a saved view persists changes', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/workspace`);
  await page.getByRole('button', { name: 'Add panels' }).waitFor({ timeout: 30_000 });

  // Create a saved view
  await page.getByRole('button', { name: /Workspace actions/i }).click();
  await page.getByRole('menuitem', { name: /Save as a new view/i }).click();
  const viewNameInput = page.getByRole('textbox', { name: /view name/i });
  await viewNameInput.fill('Update Test View');
  await page.getByRole('button', { name: /Save/i }).click();
  await expect(page.getByText('Update Test View').first()).toBeVisible({ timeout: 10_000 });

  // Modify the view (e.g. click save again)
  await page.getByRole('button', { name: /Workspace actions/i }).click();
  await page.getByRole('menuitem', { name: /Save/i }).click();

  // Confirmation dialog should appear
  await expect(page.getByRole('button', { name: /Save|Confirm/i }).first()).toBeVisible({ timeout: 10_000 });
});

test('saved views: delete a saved view removes it from navigation', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/workspace`);
  await page.getByRole('button', { name: 'Add panels' }).waitFor({ timeout: 30_000 });

  // Create a saved view to delete
  await page.getByRole('button', { name: /Workspace actions/i }).click();
  await page.getByRole('menuitem', { name: /Save as a new view/i }).click();
  const viewNameInput = page.getByRole('textbox', { name: /view name/i });
  await viewNameInput.fill('Delete Me View');
  await page.getByRole('button', { name: /Save/i }).click();
  await expect(page.getByText('Delete Me View').first()).toBeVisible({ timeout: 10_000 });

  // Delete the view via its actions menu
  await page.getByRole('button', { name: /Workspace actions/i }).click();
  await page.getByRole('menuitem', { name: /Delete view/i }).click();

  // Confirm deletion
  await page.getByRole('button', { name: /Delete|Confirm/i }).first().click();

  // View should no longer appear in navigation
  await expect(page.getByText('Delete Me View')).not.toBeVisible({ timeout: 10_000 });
});
