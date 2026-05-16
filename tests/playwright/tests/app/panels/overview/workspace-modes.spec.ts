import { test, expect } from '../../../../fixtures';

test('workspace-modes: automated mode auto-generates panels for all logged keys', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  // Navigate to workspace in automated mode
  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/workspace`);
  await page.getByRole('button', { name: 'Add panels' }).waitFor({ timeout: 30_000 });

  // Verify panels are auto-generated for the logged metric keys
  await expect(page.getByText(/train\/loss/i).first()).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText(/train\/acc/i).first()).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText(/val\/loss/i).first()).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText(/val\/acc/i).first()).toBeVisible({ timeout: 10_000 });
});

test('workspace-modes: panel count matches number of logged metric keys', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/workspace`);
  await page.getByRole('button', { name: 'Add panels' }).waitFor({ timeout: 30_000 });

  // There should be at least 4 panels (one per metric key)
  const panelEditButtons = page.getByRole('button', { name: 'Edit panel' });
  await expect(panelEditButtons).toHaveCount(4, { timeout: 10_000 });
});

test('workspace-modes: reset workspace regenerates panels', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/workspace`);
  await page.getByRole('button', { name: 'Add panels' }).waitFor({ timeout: 30_000 });

  // Open workspace settings
  await page.getByRole('button', { name: 'Workspace settings' }).click();

  // Click reset workspace
  await page.getByRole('button', { name: /reset/i }).first().click();

  // Confirm reset if a dialog appears
  const confirmButton = page.getByRole('button', { name: /confirm|reset|yes/i });
  if (await confirmButton.isVisible({ timeout: 2000 }).catch(() => false)) {
    await confirmButton.first().click();
  }

  // Panels should regenerate
  await expect(page.getByText(/train\/loss/i).first()).toBeVisible({ timeout: 10_000 });
});

test('workspace-modes: switching to manual mode clears workspace', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/workspace`);
  await page.getByRole('button', { name: 'Add panels' }).waitFor({ timeout: 30_000 });

  // Open workspace settings
  await page.getByRole('button', { name: 'Workspace settings' }).click();

  // Switch to manual mode
  await page.getByRole('button', { name: /manual/i })
    .or(page.getByLabel(/manual/i))
    .first().click();

  // Verify workspace is empty (no auto-generated panels)
  await expect(page.getByRole('button', { name: 'Edit panel' })).toHaveCount(0, { timeout: 10_000 });
});
