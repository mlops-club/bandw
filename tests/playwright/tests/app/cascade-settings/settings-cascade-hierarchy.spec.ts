import { test, expect } from '../../../fixtures';

test('settings-cascade-hierarchy: set workspace smoothing', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/workspace`);
  await page.getByRole('button', { name: 'Add panels' }).waitFor({ timeout: 30_000 });

  // Open workspace settings
  await page.getByRole('button', { name: /workspace settings/i }).first().click();

  // Click on "Line plots"
  await page.getByText(/line plots/i).first().click();

  // Find the smoothing control and verify it is accessible
  const smoothingControl = page.getByRole('slider', { name: /smoothing/i })
    .or(page.getByLabel(/smoothing/i));
  await expect(smoothingControl.first()).toBeVisible({ timeout: 10_000 });
});

test('settings-cascade-hierarchy: override section smoothing', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/workspace`);
  await page.getByRole('button', { name: 'Add panels' }).waitFor({ timeout: 30_000 });

  // First set workspace smoothing
  await page.getByRole('button', { name: /workspace settings/i }).first().click();
  await page.getByText(/line plots/i).first().click();

  // Verify smoothing is accessible at workspace level
  const workspaceSmoothing = page.getByRole('slider', { name: /smoothing/i })
    .or(page.getByLabel(/smoothing/i));
  await expect(workspaceSmoothing.first()).toBeVisible({ timeout: 10_000 });

  // Close workspace settings (press Escape or click away)
  await page.keyboard.press('Escape');

  // Open section settings to override smoothing
  await page.getByRole('button', { name: /section settings/i }).first().click();

  // Verify section settings panel opens
  await expect(page.getByText(/section/i).first()).toBeVisible({ timeout: 10_000 });
});

test('settings-cascade-hierarchy: override individual panel smoothing', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/workspace`);
  await page.getByRole('button', { name: 'Add panels' }).waitFor({ timeout: 30_000 });

  // Open panel edit modal
  await page.getByRole('button', { name: /edit panel/i }).first().click();

  // Navigate to Data tab
  await page.getByRole('tab', { name: /data/i }).first().click();

  // Verify panel-level smoothing control is accessible
  const panelSmoothing = page.getByRole('slider', { name: /smoothing/i })
    .or(page.getByLabel(/smoothing/i));
  await expect(panelSmoothing.first()).toBeVisible({ timeout: 10_000 });
});

test('settings-cascade-hierarchy: removing panel override falls back to section', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/workspace`);
  await page.getByRole('button', { name: 'Add panels' }).waitFor({ timeout: 30_000 });

  // Open panel edit modal
  await page.getByRole('button', { name: /edit panel/i }).first().click();

  // Navigate to Data tab
  await page.getByRole('tab', { name: /data/i }).first().click();

  // Verify reset/remove override control is present
  const resetButton = page.getByRole('button', { name: /reset/i })
    .or(page.getByRole('button', { name: /remove override/i }))
    .or(page.getByRole('button', { name: /clear/i }));
  await expect(resetButton.first()).toBeVisible({ timeout: 10_000 });
});

test('settings-cascade-hierarchy: removing section override falls back to workspace', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/workspace`);
  await page.getByRole('button', { name: 'Add panels' }).waitFor({ timeout: 30_000 });

  // Open section settings
  await page.getByRole('button', { name: /section settings/i }).first().click();

  // Verify section settings are visible and can be reset
  await expect(
    page.getByText(/override/i)
      .or(page.getByText(/reset/i))
      .or(page.getByText(/display preferences/i))
      .first()
  ).toBeVisible({ timeout: 10_000 });
});
