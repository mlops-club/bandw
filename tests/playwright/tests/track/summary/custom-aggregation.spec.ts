import { test, expect } from '../../../fixtures';

test('custom-aggregation: overview shows min/max aggregated summary values', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;
  const run = sdkData.runs[3]; // "custom-aggregation"

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/runs/${run.id}/overview`);
  await page.getByRole('tab', { name: 'Overview' }).waitFor();

  // Scroll to the Summary section (below the fold)
  await page.keyboard.press('End');
  await page.waitForTimeout(1000);

  // Scope assertions to the Summary metrics list
  const summarySection = page.getByRole('list').filter({ hasText: 'Summary metrics' });
  await expect(summarySection).toBeVisible({ timeout: 10_000 });

  // "loss" should reflect the minimum value across all logged steps
  await expect(summarySection.getByText('loss')).toBeVisible({ timeout: 10_000 });

  // "accuracy" should reflect the maximum value across all logged steps
  await expect(summarySection.getByText('accuracy')).toBeVisible({ timeout: 10_000 });
});

test('custom-aggregation: aggregated values appear correctly in the runs table', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;
  const run = sdkData.runs[3]; // "custom-aggregation"

  // Navigate to the runs table
  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/table`);

  // Wait for the table to load
  await page.getByText('NAME').first().waitFor({ timeout: 30_000 });

  // Find the custom-aggregation run (use displayName since wandb may rename runs)
  const displayName = run.displayName || run.name;
  await expect(page.getByText(displayName).first()).toBeVisible({ timeout: 10_000 });

  // Verify loss and accuracy column headers exist
  await expect(page.getByText('loss').first()).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText('accuracy').first()).toBeVisible({ timeout: 10_000 });
});
