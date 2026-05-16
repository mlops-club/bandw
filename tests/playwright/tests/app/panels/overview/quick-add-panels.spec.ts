import { test, expect } from '../../../../fixtures';

test('quick-add-panels: delete a panel removes it', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/workspace`);
  await page.getByRole('button', { name: 'Add panels' }).waitFor({ timeout: 30_000 });

  // Count initial panels
  const initialCount = await page.getByRole('button', { name: 'Edit panel' }).count();

  // Open panel actions menu and delete
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

test('quick-add-panels: open quick add panel list', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/workspace`);
  await page.getByRole('button', { name: 'Add panels' }).waitFor({ timeout: 30_000 });

  // Click "Add panels" then navigate to "Quick add"
  await page.getByRole('button', { name: 'Add panels' }).click();
  await page.getByRole('button', { name: /quick add/i })
    .or(page.getByText(/quick add/i)).first().click();

  // Verify quick add list appears
  await expect(page.getByText(/train\/loss|train\/acc|val\/loss|val\/acc/).first()).toBeVisible({ timeout: 10_000 });
});

test('quick-add-panels: already-present panels show checkmarks', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/workspace`);
  await page.getByRole('button', { name: 'Add panels' }).waitFor({ timeout: 30_000 });

  // Open quick add
  await page.getByRole('button', { name: 'Add panels' }).click();
  await page.getByRole('button', { name: /quick add/i })
    .or(page.getByText(/quick add/i)).first().click();

  // Verify checkmarks on already-present panels (they should have some checked indicator)
  await expect(page.getByRole('checkbox', { checked: true }).first()
    .or(page.locator('[aria-checked="true"]').first())).toBeVisible({ timeout: 10_000 });
});

test('quick-add-panels: bulk add all available panels', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/workspace`);
  await page.getByRole('button', { name: 'Add panels' }).waitFor({ timeout: 30_000 });

  // Open quick add
  await page.getByRole('button', { name: 'Add panels' }).click();
  await page.getByRole('button', { name: /quick add/i })
    .or(page.getByText(/quick add/i)).first().click();

  // Click "Add N panels" for bulk add
  await page.getByRole('button', { name: /add \d+ panel/i })
    .or(page.getByRole('button', { name: /add all/i })).first().click();

  // Verify panels are added
  await expect(page.getByText(/train\/loss/i).first()).toBeVisible({ timeout: 10_000 });
});

test('quick-add-panels: individual add on hover works', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/workspace`);
  await page.getByRole('button', { name: 'Add panels' }).waitFor({ timeout: 30_000 });

  // First delete a panel so we can re-add it
  await page.getByText(/train\/loss/i).first().hover();
  await page.getByRole('button', { name: 'More panel actions' }).first().click();
  await page.getByRole('menuitem', { name: /delete/i }).first().click();

  const confirmButton = page.getByRole('button', { name: /confirm|delete|yes/i });
  if (await confirmButton.isVisible({ timeout: 2000 }).catch(() => false)) {
    await confirmButton.first().click();
  }

  // Open quick add
  await page.getByRole('button', { name: 'Add panels' }).click();
  await page.getByRole('button', { name: /quick add/i })
    .or(page.getByText(/quick add/i)).first().click();

  // Hover over an unadded panel and click "Add"
  await page.getByText(/train\/loss/i).first().hover();
  await page.getByRole('button', { name: /^add$/i }).first().click();

  // Verify the single panel was added back
  await expect(page.getByText(/train\/loss/i).first()).toBeVisible({ timeout: 10_000 });
});
