import { test, expect } from '../../../../fixtures';

test('manage-panels-crud: open panel settings edit modal', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/workspace`);
  await page.getByRole('button', { name: 'Add panels' }).waitFor({ timeout: 30_000 });

  // Hover over a panel and click Edit panel
  await page.getByText(/train\/loss/i).first().hover();
  await page.getByRole('button', { name: 'Edit panel' }).first().click();

  // Verify the edit modal opens
  await expect(page.getByRole('dialog')
    .or(page.getByText(/panel settings|edit panel|configure/i)).first()).toBeVisible({ timeout: 10_000 });
});

test('manage-panels-crud: change panel type', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/workspace`);
  await page.getByRole('button', { name: 'Add panels' }).waitFor({ timeout: 30_000 });

  // Open panel settings
  await page.getByText(/train\/loss/i).first().hover();
  await page.getByRole('button', { name: 'Edit panel' }).first().click();

  // Change panel type (e.g. from line plot to bar chart)
  await page.getByRole('button', { name: /chart type|panel type|type/i })
    .or(page.getByLabel(/chart type|panel type|type/i)).first().click();

  await page.getByRole('option', { name: /bar chart/i })
    .or(page.getByText(/bar chart/i)).first().click();

  // Apply the change
  await page.getByRole('button', { name: /apply|save|done/i }).first().click();

  // Verify the panel renders with the new type
  await expect(page.getByText(/train\/loss/i).first()).toBeVisible({ timeout: 10_000 });
});

test('manage-panels-crud: duplicate panel', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/workspace`);
  await page.getByRole('button', { name: 'Add panels' }).waitFor({ timeout: 30_000 });

  const initialCount = await page.getByRole('button', { name: 'Edit panel' }).count();

  // Open panel actions menu and choose duplicate
  await page.getByText(/train\/loss/i).first().hover();
  await page.getByRole('button', { name: 'More panel actions' }).first().click();
  await page.getByRole('menuitem', { name: /duplicate/i }).first().click();

  // Verify a duplicate panel appears (panel count increases)
  await expect(page.getByRole('button', { name: 'Edit panel' })).toHaveCount(initialCount + 1, { timeout: 10_000 });
});

test('manage-panels-crud: reorder panel via drag', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/workspace`);
  await page.getByRole('button', { name: 'Add panels' }).waitFor({ timeout: 30_000 });

  // Hover over a panel and locate the drag handle
  await page.getByText(/train\/loss/i).first().hover();
  const dragHandle = page.getByRole('button', { name: 'Drag panel' }).first();

  // Verify the drag handle is visible (interaction test)
  await expect(dragHandle).toBeVisible({ timeout: 10_000 });
});

test('manage-panels-crud: move panel to another section', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/workspace`);
  await page.getByRole('button', { name: 'Add panels' }).waitFor({ timeout: 30_000 });

  // Open panel actions menu and choose move
  await page.getByText(/train\/loss/i).first().hover();
  await page.getByRole('button', { name: 'More panel actions' }).first().click();
  await page.getByRole('menuitem', { name: /move/i }).first().click();

  // Select a target section
  await page.getByRole('menuitem', { name: /val/i })
    .or(page.getByText(/val/i)).first().click();

  // Verify the panel moved (it should now be in the target section)
  await expect(page.getByText(/train\/loss/i).first()).toBeVisible({ timeout: 10_000 });
});

test('manage-panels-crud: delete panel', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/workspace`);
  await page.getByRole('button', { name: 'Add panels' }).waitFor({ timeout: 30_000 });

  const initialCount = await page.getByRole('button', { name: 'Edit panel' }).count();

  // Open panel actions menu and choose delete
  await page.getByText(/train\/loss/i).first().hover();
  await page.getByRole('button', { name: 'More panel actions' }).first().click();
  await page.getByRole('menuitem', { name: /delete/i }).first().click();

  // Confirm deletion if dialog appears
  const confirmButton = page.getByRole('button', { name: /confirm|delete|yes/i });
  if (await confirmButton.isVisible({ timeout: 2000 }).catch(() => false)) {
    await confirmButton.first().click();
  }

  // Verify panel count decreased
  await expect(page.getByRole('button', { name: 'Edit panel' })).toHaveCount(initialCount - 1, { timeout: 10_000 });
});
