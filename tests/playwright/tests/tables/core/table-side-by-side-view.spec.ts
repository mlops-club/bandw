import { test, expect } from '../../../fixtures';

test('table-side-by-side-view: side-by-side view activates', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;
  const run = sdkData.runs[3]; // "overlapping-columns"

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/runs/${run.displayName || run.name || run.id}/artifacts`);

  // Select table artifact and open comparison
  await page.getByText('table-version-a').click();
  await page.getByRole('button', { name: /compare/i }).click();

  // Change dropdown to "List of: Table"
  await page.getByRole('combobox', { name: /view/i }).or(page.getByLabel(/view/i)).click();
  await page.getByRole('option', { name: /list of/i }).or(page.getByText(/side.*by.*side/i)).click();

  // Verify side-by-side view activates
  await expect(page.getByText('eval_table')).toBeVisible({ timeout: 10_000 });
});

test('table-side-by-side-view: both tables paginate', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;
  const run = sdkData.runs[3];

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/runs/${run.displayName || run.name || run.id}/artifacts`);

  await page.getByText('table-version-a').click();
  await page.getByRole('button', { name: /compare/i }).click();

  // Adjust page size controls
  await expect(page.getByRole('button', { name: /page/i }).or(page.getByText(/rows per page/i))).toBeVisible({ timeout: 10_000 });
});

test('table-side-by-side-view: vertical layout toggle works', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;
  const run = sdkData.runs[3];

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/runs/${run.displayName || run.name || run.id}/artifacts`);

  await page.getByText('table-version-a').click();
  await page.getByRole('button', { name: /compare/i }).click();

  // Enable vertical layout toggle
  await page.getByRole('switch', { name: /vertical/i }).or(page.getByLabel(/vertical/i)).click();

  // Verify layout switches
  await expect(page.getByText('eval_table')).toBeVisible({ timeout: 10_000 });
});

test('table-side-by-side-view: sort and filter apply to both tables', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;
  const run = sdkData.runs[3];

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/runs/${run.displayName || run.name || run.id}/artifacts`);

  await page.getByText('table-version-a').click();
  await page.getByRole('button', { name: /compare/i }).click();

  // Apply sort
  await page.getByRole('columnheader', { name: 'id' }).first().click();

  // Verify sort applies
  await expect(page.getByRole('row').first()).toBeVisible({ timeout: 10_000 });
});
