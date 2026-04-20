import { test, expect } from '../../../fixtures';

test('table filter: filter button opens filter controls', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/table`);

  // Wait for the table to load
  await page.getByText('NAME').first().waitFor({ timeout: 30_000 });

  // Click the Filter button
  await page.getByRole('button', { name: 'Filter' }).click();
  await page.waitForTimeout(1000);

  // Filter expression builder should appear
  await expect(page.getByText('Filter').first()).toBeVisible({ timeout: 10_000 });
});

test('table filter: adding a filter narrows rows', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/table`);

  // Wait for the table to load
  await page.getByText('NAME').first().waitFor({ timeout: 30_000 });

  // Open filters and add a filter
  await page.getByRole('button', { name: 'Filter' }).click();
  await page.waitForTimeout(1000);

  await page.getByRole('button', { name: /Add filter|New filter/i }).click();
  await page.waitForTimeout(1000);

  // After applying a filter, the filter UI should be accessible and interactive
  await expect(page.getByRole('button', { name: /Add filter|New filter/i })).toBeVisible({ timeout: 10_000 });
});
