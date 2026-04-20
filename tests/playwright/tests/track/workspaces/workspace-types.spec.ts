import { test, expect } from '../../../fixtures';

test('workspace types: personal workspace loads', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/workspace`);

  // Workspace page should load with chart content visible
  await page.getByRole('button', { name: 'Add panels' }).waitFor({ timeout: 30_000 });
});

test('workspace types: personal workspace badge visible', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/workspace`);
  await page.getByRole('button', { name: 'Add panels' }).waitFor({ timeout: 30_000 });

  // Verify the workspace is labeled as personal
  await expect(page.getByText(/Personal/i).first()).toBeVisible({ timeout: 10_000 });
});

test('workspace types: workspace name is editable', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/workspace`);
  await page.getByRole('button', { name: 'Add panels' }).waitFor({ timeout: 30_000 });

  // Open the workspace menu to access name editing
  await page.getByRole('button', { name: /Toggle named workspace menu/i }).click();

  // The workspace name field should be editable
  const nameInput = page.getByRole('textbox', { name: /workspace name/i }).first();
  await expect(nameInput).toBeVisible({ timeout: 10_000 });
  await nameInput.fill('My Custom Workspace');
  await expect(nameInput).toHaveValue('My Custom Workspace');
});
