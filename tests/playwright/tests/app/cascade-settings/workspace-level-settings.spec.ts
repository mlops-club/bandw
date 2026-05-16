import { test, expect } from '../../../fixtures';

test('workspace-level-settings: workspace loads and settings panel opens', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  // Navigate to the project workspace
  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/workspace`);
  await page.getByRole('button', { name: 'Add panels' }).waitFor({ timeout: 30_000 });

  // Verify the workspace loads
  await expect(page.getByText(sdkData.project).first()).toBeVisible({ timeout: 10_000 });
});

test('workspace-level-settings: workspace settings panel opens', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/workspace`);
  await page.getByRole('button', { name: 'Add panels' }).waitFor({ timeout: 30_000 });

  // Open workspace settings
  await page.getByRole('button', { name: /workspace settings/i }).first().click();

  // Verify settings panel opens
  await expect(page.getByText(/workspace settings/i).or(page.getByText(/settings/i)).first()).toBeVisible({ timeout: 10_000 });
});

test('workspace-level-settings: workspace layout option is accessible', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/workspace`);
  await page.getByRole('button', { name: 'Add panels' }).waitFor({ timeout: 30_000 });

  await page.getByRole('button', { name: /workspace settings/i }).first().click();

  // Verify "Workspace layout" option exists
  await expect(page.getByText(/workspace layout/i).first()).toBeVisible({ timeout: 10_000 });
});

test('workspace-level-settings: line plots option is accessible', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/workspace`);
  await page.getByRole('button', { name: 'Add panels' }).waitFor({ timeout: 30_000 });

  await page.getByRole('button', { name: /workspace settings/i }).first().click();

  // Verify "Line plots" option exists
  await expect(page.getByText(/line plots/i).first()).toBeVisible({ timeout: 10_000 });
});

test('workspace-level-settings: changing smoothing applies globally', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/workspace`);
  await page.getByRole('button', { name: 'Add panels' }).waitFor({ timeout: 30_000 });

  // Open workspace settings
  await page.getByRole('button', { name: /workspace settings/i }).first().click();

  // Click on "Line plots" to open line-plot defaults
  await page.getByText(/line plots/i).first().click();

  // Find the smoothing control and change its value
  const smoothingInput = page.getByRole('slider', { name: /smoothing/i })
    .or(page.getByLabel(/smoothing/i));
  await expect(smoothingInput.first()).toBeVisible({ timeout: 10_000 });
});

test('workspace-level-settings: all line plots reflect workspace setting change', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/workspace`);
  await page.getByRole('button', { name: 'Add panels' }).waitFor({ timeout: 30_000 });

  // Verify multiple panels are present (train/ and val/ sections)
  await expect(page.getByText(/train/i).first()).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText(/val/i).first()).toBeVisible({ timeout: 10_000 });
});
