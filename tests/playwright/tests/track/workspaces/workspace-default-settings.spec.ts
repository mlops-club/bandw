import { test, expect } from '../../../fixtures';

test('default settings: workspace settings panel opens', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/workspace`);
  await page.getByRole('button', { name: 'Add panels' }).waitFor({ timeout: 30_000 });

  // Open workspace settings
  await page.getByRole('button', { name: /Workspace settings/i }).click();

  // Settings panel should be visible
  await expect(page.getByText(/settings/i).first()).toBeVisible({ timeout: 10_000 });
});

test('default settings: hide empty sections toggle exists', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/workspace`);
  await page.getByRole('button', { name: 'Add panels' }).waitFor({ timeout: 30_000 });

  await page.getByRole('button', { name: /Workspace settings/i }).click();

  // Verify "Hide empty sections during search" toggle
  const hideEmptyToggle = page.getByRole('switch', { name: /Hide empty sections/i })
    .or(page.getByRole('checkbox', { name: /Hide empty sections/i }))
    .or(page.getByLabel(/Hide empty sections/i));
  await expect(hideEmptyToggle.first()).toBeVisible({ timeout: 10_000 });
});

test('default settings: sort panels alphabetically toggle exists', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/workspace`);
  await page.getByRole('button', { name: 'Add panels' }).waitFor({ timeout: 30_000 });

  await page.getByRole('button', { name: /Workspace settings/i }).click();

  // Verify "Sort panels alphabetically" toggle
  const sortToggle = page.getByRole('switch', { name: /Sort panels alphabetically/i })
    .or(page.getByRole('checkbox', { name: /Sort panels alphabetically/i }))
    .or(page.getByLabel(/Sort panels alphabetically/i));
  await expect(sortToggle.first()).toBeVisible({ timeout: 10_000 });
});

test('default settings: line plot defaults are correct', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/workspace`);
  await page.getByRole('button', { name: 'Add panels' }).waitFor({ timeout: 30_000 });

  await page.getByRole('button', { name: /Workspace settings/i }).click();

  // Verify line plot defaults: X axis = Step
  await expect(page.getByText(/Step/).first()).toBeVisible({ timeout: 10_000 });

  // Max runs should default to 10
  await expect(page.getByText(/10/).first()).toBeVisible({ timeout: 10_000 });
});

test('default settings: section organization default', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/workspace`);
  await page.getByRole('button', { name: 'Add panels' }).waitFor({ timeout: 30_000 });

  await page.getByRole('button', { name: /Workspace settings/i }).click();

  // Verify section organization shows "first prefix" as default grouping
  await expect(page.getByText(/first prefix/i).first()).toBeVisible({ timeout: 10_000 });
});
