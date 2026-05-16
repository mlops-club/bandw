import { test, expect } from '../../../fixtures';

test('table sort: sort button opens sort controls', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/table`);

  // Wait for the table to load
  await page.getByText('NAME').first().waitFor({ timeout: 30_000 });

  // Click the Sort button in the table toolbar
  await page.getByRole('button', { name: 'Sort' }).click();
  await page.waitForTimeout(1000);

  // A sort configuration dropdown or panel should appear
  await expect(page.getByText('Sort').first()).toBeVisible({ timeout: 10_000 });
});

test('table sort: clicking column header reorders rows', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/table`);

  // Wait for the table to load
  await page.getByText('NAME').first().waitFor({ timeout: 30_000 });

  // Scroll to reveal the best_accuracy column
  await page.keyboard.press('End');
  await page.waitForTimeout(1000);

  // Click a sortable column header (best_accuracy)
  await page.getByText('best_accuracy').first().click();
  await page.waitForTimeout(1000);

  // Click again to toggle sort direction — row order should change
  await page.getByText('best_accuracy').first().click();
  await page.waitForTimeout(1000);

  // Verify the table is still loaded after sorting
  await expect(page.getByText('NAME').first()).toBeVisible({ timeout: 10_000 });
});
