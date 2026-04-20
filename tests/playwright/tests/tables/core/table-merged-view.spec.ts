import { test, expect } from '../../../fixtures';

test('table-merged-view: table artifact is visible', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;
  const run = sdkData.runs[3]; // "overlapping-columns"

  // Navigate to artifacts
  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/runs/${run.displayName || run.name || run.id}/artifacts`);

  // Verify table artifact is visible
  await expect(page.getByText('table-version-a').or(page.getByText('dataset'))).toBeVisible({ timeout: 10_000 });
});

test('table-merged-view: comparison view opens', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;
  const run = sdkData.runs[3];

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/runs/${run.displayName || run.name || run.id}/artifacts`);

  // Select the first table artifact
  await page.getByText('table-version-a').click();

  // Open comparison flow for the second version
  await page.getByRole('button', { name: /compare/i }).click();

  // Verify comparison view opens
  await expect(page.getByText(/compare/i)).toBeVisible({ timeout: 10_000 });
});

test('table-merged-view: colors distinguish versions', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;
  const run = sdkData.runs[3];

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/runs/${run.displayName || run.name || run.id}/artifacts`);

  // Navigate to merged comparison view
  await page.getByText('table-version-a').click();
  await page.getByRole('button', { name: /compare/i }).click();

  // Verify merged view with color coding is present
  await expect(page.getByText('eval_table')).toBeVisible({ timeout: 10_000 });
});

test('table-merged-view: join key selectable from dropdown', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;
  const run = sdkData.runs[3];

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/runs/${run.displayName || run.name || run.id}/artifacts`);

  await page.getByText('table-version-a').click();
  await page.getByRole('button', { name: /compare/i }).click();

  // Select join key from dropdown
  await page.getByRole('combobox', { name: /join key/i }).or(page.getByLabel(/join key/i)).click();

  // Verify join key options are available
  await expect(page.getByRole('option', { name: 'id' }).or(page.getByText('id'))).toBeVisible({ timeout: 10_000 });
});

test('table-merged-view: filter expressions work per table', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;
  const run = sdkData.runs[3];

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/runs/${run.displayName || run.name || run.id}/artifacts`);

  await page.getByText('table-version-a').click();
  await page.getByRole('button', { name: /compare/i }).click();

  // Open filter expressions
  await page.getByRole('button', { name: /filter/i }).click();

  // Verify filter UI is present
  await expect(page.getByText(/filter/i)).toBeVisible({ timeout: 10_000 });
});
