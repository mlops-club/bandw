import { test, expect } from '../../../fixtures';

test('table search: typing filters runs by name', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/table`);

  // Wait for the table to load
  await page.getByText('NAME').first().waitFor({ timeout: 30_000 });

  // Type in the search box — use exact role name to avoid matching cookie search
  const searchBox = page.getByRole('combobox', { name: 'Search runs' })
    .or(page.getByPlaceholder('Search runs'));
  await searchBox.first().fill('train');
  await page.waitForTimeout(2000);

  // Runs with "train" in the name should be visible
  await expect(page.getByText('train').first()).toBeVisible({ timeout: 10_000 });
});

test('table search: clearing search shows all runs', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/table`);

  // Wait for the table to load
  await page.getByText('NAME').first().waitFor({ timeout: 30_000 });

  // Filter then clear — use exact role name to avoid matching cookie search
  const searchBox = page.getByRole('combobox', { name: 'Search runs' })
    .or(page.getByPlaceholder('Search runs'));
  await searchBox.first().fill('eval');
  await page.waitForTimeout(2000);

  await searchBox.first().clear();
  await page.waitForTimeout(2000);

  // All runs should be visible again — verify at least one run is present
  const run0Name = sdkData.runs[0].displayName || sdkData.runs[0].name;
  await expect(page.getByText(run0Name).first()).toBeVisible({ timeout: 10_000 });
});
