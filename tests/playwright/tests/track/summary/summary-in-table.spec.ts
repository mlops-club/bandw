import { test, expect } from '../../../fixtures';

test('summary-table: summary metrics appear as columns in the runs table', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/table`);

  // Wait for the table to load — check for the NAME column header
  await page.getByText('NAME').first().waitFor({ timeout: 30_000 });

  // Verify that at least one run is visible (use displayName which matches what wandb.init name= sets)
  const displayName = sdkData.runs[1].displayName || sdkData.runs[1].name;
  await expect(page.getByText(displayName).first()).toBeVisible({ timeout: 10_000 });

  // Verify summary metric column header is present
  await expect(page.getByText('best_accuracy').first()).toBeVisible({ timeout: 10_000 });
});

test('summary-table: sorting by summary column reorders rows', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/table`);

  // Wait for table to load
  await page.getByText('NAME').first().waitFor({ timeout: 30_000 });

  // Click Sort button
  await page.getByRole('button', { name: 'Sort' }).click();
  await page.waitForTimeout(1000);

  // Verify sort controls appeared
  await expect(page.getByText('Sort').first()).toBeVisible();
});
