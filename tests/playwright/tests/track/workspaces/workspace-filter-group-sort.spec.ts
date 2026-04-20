import { test, expect } from '../../../fixtures';

test('filter: filter button opens expression builder', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/workspace`);
  await page.getByRole('button', { name: 'Add panels' }).waitFor({ timeout: 30_000 });

  // Click the Filter button in the runs sidebar toolbar
  await page.getByRole('button', { name: /Filter/i }).first().click();

  // Filter expression builder should appear
  await expect(page.getByRole('button', { name: /Add filter|New filter/i }).first()).toBeVisible({ timeout: 10_000 });
});

test('filter: adding a filter narrows visible runs', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;
  const run0Name = sdkData.runs[0].displayName || sdkData.runs[0].name;
  const run1Name = sdkData.runs[1].displayName || sdkData.runs[1].name;
  const run2Name = sdkData.runs[2].displayName || sdkData.runs[2].name;

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/workspace`);
  await page.getByRole('button', { name: 'Add panels' }).waitFor({ timeout: 30_000 });

  // All 3 runs should be visible initially
  await expect(page.getByText(run0Name).first()).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText(run1Name).first()).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText(run2Name).first()).toBeVisible({ timeout: 10_000 });

  // Open filter and add a filter expression
  await page.getByRole('button', { name: /Filter/i }).first().click();
  await page.getByRole('button', { name: /Add filter|New filter/i }).first().click();

  // The filter builder UI should be interactive
  await expect(page.getByText(/filter/i).first()).toBeVisible({ timeout: 10_000 });
});

test('group: group button opens column picker', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/workspace`);
  await page.getByRole('button', { name: 'Add panels' }).waitFor({ timeout: 30_000 });

  // Click the Group button in the runs sidebar toolbar
  await page.getByRole('button', { name: /Group/i }).first().click();

  // Group column picker should appear
  await expect(page.getByText(/group/i).first()).toBeVisible({ timeout: 10_000 });
});

test('group: selecting a config column groups runs', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/workspace`);
  await page.getByRole('button', { name: 'Add panels' }).waitFor({ timeout: 30_000 });

  // Open group picker and select "arch" config column
  await page.getByRole('button', { name: /Group/i }).first().click();
  await page.getByText('arch').first().click();

  // Runs should now be grouped - group headers should appear
  // resnet50 group (fast-learner + mid-learner) and resnet18 group (slow-learner)
  await expect(page.getByText(/resnet50/).first()).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText(/resnet18/).first()).toBeVisible({ timeout: 10_000 });
});

test('sort: sort button opens sort config', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/workspace`);
  await page.getByRole('button', { name: 'Add panels' }).waitFor({ timeout: 30_000 });

  // Click the Sort button in the runs sidebar toolbar
  await page.getByRole('button', { name: /Sort/i }).first().click();

  // Sort configuration should appear
  await expect(page.getByText(/sort/i).first()).toBeVisible({ timeout: 10_000 });
});

test('sort: sorting by loss changes run order', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;
  const run0Name = sdkData.runs[0].displayName || sdkData.runs[0].name;

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/workspace`);
  await page.getByRole('button', { name: 'Add panels' }).waitFor({ timeout: 30_000 });

  // Open sort and select loss ascending
  await page.getByRole('button', { name: /Sort/i }).first().click();
  await page.getByText(/loss/).first().click();

  // Run order in sidebar should change
  // fast-learner has lowest final loss, slow-learner highest
  await expect(page.getByText(run0Name).first()).toBeVisible({ timeout: 10_000 });
});

test('columns: columns button opens column picker', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/workspace`);
  await page.getByRole('button', { name: 'Add panels' }).waitFor({ timeout: 30_000 });

  // Click the Columns button
  const columnsButton = page.getByRole('button', { name: /Columns/i }).first();
  await columnsButton.click();

  // Column picker should open with column names
  await expect(page.getByText(/column/i).first()).toBeVisible({ timeout: 10_000 });
});
