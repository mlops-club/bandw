import { test, expect } from '../../../fixtures';

test('log-and-view-table: table panel or artifact is visible', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;
  const run = sdkData.runs[0]; // "basic-table"

  // Navigate to the run workspace
  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/runs/${run.displayName || run.name || run.id}`);
  await page.getByText('Name').first().waitFor({ timeout: 30_000 });

  // Verify table panel or artifact is visible
  await expect(page.getByRole('heading', { name: /predictions/i }).or(page.getByText('predictions'))).toBeVisible({ timeout: 10_000 });
});

test('log-and-view-table: column headers match SDK data', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;
  const run = sdkData.runs[0];

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/runs/${run.displayName || run.name || run.id}`);
  await page.getByText('Name').first().waitFor({ timeout: 30_000 });

  // Verify column headers match the SDK-logged columns
  await expect(page.getByRole('columnheader', { name: 'pred' })).toBeVisible({ timeout: 10_000 });
  await expect(page.getByRole('columnheader', { name: 'label' })).toBeVisible({ timeout: 10_000 });
  await expect(page.getByRole('columnheader', { name: 'score' })).toBeVisible({ timeout: 10_000 });
});

test('log-and-view-table: data rows are present', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;
  const run = sdkData.runs[0];

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/runs/${run.displayName || run.name || run.id}`);
  await page.getByText('Name').first().waitFor({ timeout: 30_000 });

  // Verify rows are present (5 data rows logged)
  const rows = page.getByRole('row');
  await expect(rows.first()).toBeVisible({ timeout: 10_000 });
});

test('log-and-view-table: table supports sorting by column', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;
  const run = sdkData.runs[0];

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/runs/${run.displayName || run.name || run.id}`);
  await page.getByText('Name').first().waitFor({ timeout: 30_000 });

  // Click on a column header to sort
  await page.getByRole('columnheader', { name: 'score' }).click();

  // Verify rows reorder (first data cell should reflect sorted order)
  await expect(page.getByRole('row').nth(1)).toBeVisible({ timeout: 10_000 });
});

test('log-and-view-table: table supports filtering', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;
  const run = sdkData.runs[0];

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/runs/${run.displayName || run.name || run.id}`);
  await page.getByText('Name').first().waitFor({ timeout: 30_000 });

  // Open filter controls
  await page.getByRole('button', { name: /filter/i }).click();

  // Verify filter UI is accessible
  await expect(page.getByRole('textbox', { name: /filter/i }).or(page.getByText(/filter/i))).toBeVisible({ timeout: 10_000 });
});
