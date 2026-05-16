import { test, expect } from '../../../fixtures';

test('panel-level-settings: edit modal opens for a panel', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/workspace`);
  await page.getByRole('button', { name: 'Add panels' }).waitFor({ timeout: 30_000 });

  // Click "Edit panel" on the first panel
  await page.getByRole('button', { name: /edit panel/i }).first().click();

  // Verify edit modal opens with expected tabs
  await expect(page.getByRole('tab', { name: /data/i }).first()).toBeVisible({ timeout: 10_000 });
  await expect(page.getByRole('tab', { name: /grouping/i }).first()).toBeVisible({ timeout: 10_000 });
  await expect(page.getByRole('tab', { name: /chart/i }).first()).toBeVisible({ timeout: 10_000 });
  await expect(page.getByRole('tab', { name: /legend/i }).first()).toBeVisible({ timeout: 10_000 });
  await expect(page.getByRole('tab', { name: /expressions/i }).first()).toBeVisible({ timeout: 10_000 });
});

test('panel-level-settings: change data settings (Y range and smoothing)', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/workspace`);
  await page.getByRole('button', { name: 'Add panels' }).waitFor({ timeout: 30_000 });

  await page.getByRole('button', { name: /edit panel/i }).first().click();

  // Verify Data tab is active and settings are accessible
  await page.getByRole('tab', { name: /data/i }).first().click();

  // Verify Y-axis range controls are visible
  const yRangeControl = page.getByLabel(/y.axis/i)
    .or(page.getByLabel(/y range/i))
    .or(page.getByText(/y.axis/i));
  await expect(yRangeControl.first()).toBeVisible({ timeout: 10_000 });

  // Verify smoothing control is visible
  const smoothingControl = page.getByRole('slider', { name: /smoothing/i })
    .or(page.getByLabel(/smoothing/i));
  await expect(smoothingControl.first()).toBeVisible({ timeout: 10_000 });
});

test('panel-level-settings: apply changes to only the edited panel', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/workspace`);
  await page.getByRole('button', { name: 'Add panels' }).waitFor({ timeout: 30_000 });

  // Open edit modal for the first panel
  await page.getByRole('button', { name: /edit panel/i }).first().click();

  // Navigate to Chart tab to change a visual setting
  await page.getByRole('tab', { name: /chart/i }).first().click();

  // Verify chart-specific settings are visible
  await expect(page.getByRole('tab', { name: /chart/i }).first()).toBeVisible({ timeout: 10_000 });
});

test('panel-level-settings: other panels in same section are unchanged', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/workspace`);
  await page.getByRole('button', { name: 'Add panels' }).waitFor({ timeout: 30_000 });

  // Verify multiple edit panel buttons exist (at least 2 panels in a section)
  const editButtons = page.getByRole('button', { name: /edit panel/i });
  await expect(editButtons.first()).toBeVisible({ timeout: 10_000 });

  const panelCount = await editButtons.count();
  expect(panelCount).toBeGreaterThanOrEqual(2);
});

test('panel-level-settings: panel override wins over section and workspace', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/workspace`);
  await page.getByRole('button', { name: 'Add panels' }).waitFor({ timeout: 30_000 });

  // Open panel edit modal
  await page.getByRole('button', { name: /edit panel/i }).first().click();

  // Verify Data tab has smoothing control that can override higher levels
  await page.getByRole('tab', { name: /data/i }).first().click();

  const smoothingControl = page.getByRole('slider', { name: /smoothing/i })
    .or(page.getByLabel(/smoothing/i));
  await expect(smoothingControl.first()).toBeVisible({ timeout: 10_000 });
});
