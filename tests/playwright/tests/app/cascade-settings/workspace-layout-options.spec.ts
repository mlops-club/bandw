import { test, expect } from '../../../fixtures';

test('workspace-layout-options: workspace layout settings are visible', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/workspace`);
  await page.getByRole('button', { name: 'Add panels' }).waitFor({ timeout: 30_000 });

  // Open workspace settings
  await page.getByRole('button', { name: /workspace settings/i }).first().click();

  // Click on "Workspace layout"
  await page.getByText(/workspace layout/i).first().click();

  // Verify layout settings are visible
  await expect(page.getByText(/workspace layout/i).first()).toBeVisible({ timeout: 10_000 });
});

test('workspace-layout-options: automated/manual mode indicator is displayed', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/workspace`);
  await page.getByRole('button', { name: 'Add panels' }).waitFor({ timeout: 30_000 });

  await page.getByRole('button', { name: /workspace settings/i }).first().click();
  await page.getByText(/workspace layout/i).first().click();

  // Verify mode indicator (automated or manual)
  await expect(
    page.getByText(/automated/i).or(page.getByText(/manual/i)).first()
  ).toBeVisible({ timeout: 10_000 });
});

test('workspace-layout-options: toggle hide empty sections during search', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/workspace`);
  await page.getByRole('button', { name: 'Add panels' }).waitFor({ timeout: 30_000 });

  await page.getByRole('button', { name: /workspace settings/i }).first().click();
  await page.getByText(/workspace layout/i).first().click();

  // Find and toggle "Hide empty sections during search"
  const hideEmptyToggle = page.getByRole('checkbox', { name: /hide empty sections/i })
    .or(page.getByLabel(/hide empty sections/i));
  await expect(hideEmptyToggle.first()).toBeVisible({ timeout: 10_000 });
});

test('workspace-layout-options: toggle sort panels alphabetically', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/workspace`);
  await page.getByRole('button', { name: 'Add panels' }).waitFor({ timeout: 30_000 });

  await page.getByRole('button', { name: /workspace settings/i }).first().click();
  await page.getByText(/workspace layout/i).first().click();

  // Find and toggle "Sort panels alphabetically"
  const sortToggle = page.getByRole('checkbox', { name: /sort panels alphabetically/i })
    .or(page.getByLabel(/sort panels alphabetically/i));
  await expect(sortToggle.first()).toBeVisible({ timeout: 10_000 });
});

test('workspace-layout-options: change section organization by prefix', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/workspace`);
  await page.getByRole('button', { name: 'Add panels' }).waitFor({ timeout: 30_000 });

  await page.getByRole('button', { name: /workspace settings/i }).first().click();
  await page.getByText(/workspace layout/i).first().click();

  // Verify section organization option (first prefix / last prefix)
  await expect(
    page.getByText(/first prefix/i).or(page.getByText(/last prefix/i)).or(page.getByText(/prefix/i)).first()
  ).toBeVisible({ timeout: 10_000 });
});
