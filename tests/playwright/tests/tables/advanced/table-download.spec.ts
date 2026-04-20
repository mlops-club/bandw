import { test, expect } from '../../../fixtures';

test('table-download: table is visible', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;
  const run = sdkData.runs[3]; // "download-table"

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/runs/${run.displayName || run.name || run.id}`);
  await page.getByText('Name').first().waitFor({ timeout: 30_000 });

  // Verify table is visible
  await expect(page.getByText('download_data').or(page.getByRole('table'))).toBeVisible({ timeout: 10_000 });
});

test('table-download: export options appear', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;
  const run = sdkData.runs[3];

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/runs/${run.displayName || run.name || run.id}`);
  await page.getByText('Name').first().waitFor({ timeout: 30_000 });

  // Open the table export or actions menu
  await page.getByRole('button', { name: /export/i }).or(page.getByRole('button', { name: /download/i })).or(page.getByRole('button', { name: /actions/i })).click();

  // Verify export options appear
  await expect(page.getByText(/download/i).or(page.getByText(/export/i)).or(page.getByText(/csv/i))).toBeVisible({ timeout: 10_000 });
});

test('table-download: file downloads', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;
  const run = sdkData.runs[3];

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/runs/${run.displayName || run.name || run.id}`);
  await page.getByText('Name').first().waitFor({ timeout: 30_000 });

  // Set up download listener
  const downloadPromise = page.waitForEvent('download');

  // Click export/download
  await page.getByRole('button', { name: /export/i }).or(page.getByRole('button', { name: /download/i })).or(page.getByRole('button', { name: /actions/i })).click();
  await page.getByRole('menuitem', { name: /download/i }).or(page.getByText(/csv/i)).click();

  // Verify download starts
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBeTruthy();
});
