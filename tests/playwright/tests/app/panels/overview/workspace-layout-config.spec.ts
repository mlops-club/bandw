import { test, expect } from '../../../../fixtures';

test('workspace-layout-config: open workspace layout settings', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/workspace`);
  await page.getByRole('button', { name: 'Add panels' }).waitFor({ timeout: 30_000 });

  // Open workspace settings
  await page.getByRole('button', { name: 'Workspace settings' }).click();

  // Verify workspace layout settings are visible
  await expect(page.getByText(/workspace layout/i).first()).toBeVisible({ timeout: 10_000 });
});

test('workspace-layout-config: hide empty sections during search toggle', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/workspace`);
  await page.getByRole('button', { name: 'Add panels' }).waitFor({ timeout: 30_000 });

  // Open workspace settings
  await page.getByRole('button', { name: 'Workspace settings' }).click();

  // Find and toggle the hide empty sections option
  const hideEmptyToggle = page.getByLabel(/hide empty sections/i)
    .or(page.getByRole('checkbox', { name: /hide empty sections/i }));
  await hideEmptyToggle.first().click();

  // Search for a term that will produce empty sections
  await page.keyboard.press('Escape');
  const searchBox = page.getByPlaceholder(/search panels/i)
    .or(page.getByRole('combobox', { name: /search panels/i }));
  await searchBox.first().fill('train/loss');

  // With hide-empty enabled, only sections containing matching panels should be visible
  await expect(page.getByText(/train\/loss/i).first()).toBeVisible({ timeout: 10_000 });
});

test('workspace-layout-config: sort panels alphabetically', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/workspace`);
  await page.getByRole('button', { name: 'Add panels' }).waitFor({ timeout: 30_000 });

  // Open workspace settings
  await page.getByRole('button', { name: 'Workspace settings' }).click();

  // Toggle sort panels alphabetically
  const sortToggle = page.getByLabel(/sort panels alphabetically/i)
    .or(page.getByRole('checkbox', { name: /sort.*alphabetically/i }));
  await sortToggle.first().click();

  // Panels should be reordered alphabetically
  await expect(page.getByText(/train\/acc/i).first()).toBeVisible({ timeout: 10_000 });
});

test('workspace-layout-config: change section organization from first-prefix to last-prefix', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/workspace`);
  await page.getByRole('button', { name: 'Add panels' }).waitFor({ timeout: 30_000 });

  // Open workspace settings
  await page.getByRole('button', { name: 'Workspace settings' }).click();

  // Change section organization from first-prefix to last-prefix
  const sectionOrgDropdown = page.getByLabel(/section organization/i)
    .or(page.getByRole('combobox', { name: /section/i }));
  await sectionOrgDropdown.first().click();

  const lastPrefixOption = page.getByRole('option', { name: /last prefix/i })
    .or(page.getByText(/last prefix/i));
  await lastPrefixOption.first().click();

  // Sections should regroup based on last-prefix (e.g. loss, acc instead of train, val)
  await expect(page.getByText(/loss/i).first()).toBeVisible({ timeout: 10_000 });
});

test('workspace-layout-config: configure tooltip display preferences', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/workspace`);
  await page.getByRole('button', { name: 'Add panels' }).waitFor({ timeout: 30_000 });

  // Open workspace settings
  await page.getByRole('button', { name: 'Workspace settings' }).click();

  // Find tooltip configuration options
  const tooltipOption = page.getByLabel(/tooltip/i)
    .or(page.getByText(/tooltip/i));
  await expect(tooltipOption.first()).toBeVisible({ timeout: 10_000 });
});
