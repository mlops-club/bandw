import { test, expect } from '../../../fixtures';

test('overview-summary: displays explicit and auto-generated summary metrics', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;
  const run = sdkData.runs[0]; // "basic-run"

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/runs/${run.id}/overview`);
  await page.getByRole('tab', { name: 'Overview' }).waitFor({ timeout: 30_000 });

  // Scroll to Summary section (below the fold)
  await page.keyboard.press('End');
  await page.waitForTimeout(1000);

  // Scope to Summary metrics list
  const summarySection = page.getByRole('list').filter({ hasText: 'Summary metrics' });
  await expect(summarySection).toBeVisible({ timeout: 10_000 });

  // Verify explicitly set summary key "best_accuracy" with value 0.95
  await expect(summarySection.getByText('best_accuracy')).toBeVisible({ timeout: 10_000 });
  await expect(summarySection.getByText('0.95')).toBeVisible({ timeout: 10_000 });

  // Verify auto-generated summary keys from logged metrics
  // Use exact match to avoid matching "best_accuracy" when looking for "accuracy"
  await expect(summarySection.getByText('loss', { exact: true }).or(summarySection.getByText('loss:'))).toBeVisible({ timeout: 10_000 });
  await expect(summarySection.getByText('accuracy:', { exact: true })).toBeVisible({ timeout: 10_000 });
});

test('overview-summary: search filters summary keys', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;
  const run = sdkData.runs[0]; // "basic-run"

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/runs/${run.id}/overview`);
  await page.getByRole('tab', { name: 'Overview' }).waitFor({ timeout: 30_000 });

  // Scroll to Summary section (below the fold)
  await page.keyboard.press('End');
  await page.waitForTimeout(1000);

  // Scope to Summary metrics list
  const summarySection = page.getByRole('list').filter({ hasText: 'Summary metrics' });
  await expect(summarySection).toBeVisible({ timeout: 10_000 });

  // Locate the Summary section's search box (second regex search box on page)
  const searchBoxes = page.getByPlaceholder('search keys with regex');
  // Summary search box is typically the second one (after Config search)
  const summarySearch = searchBoxes.last();
  await summarySearch.fill('best_accuracy');

  // best_accuracy should remain visible
  await expect(summarySection.getByText('best_accuracy')).toBeVisible({ timeout: 10_000 });

  // Clear search
  await summarySearch.clear();

  // All summary keys should be visible again — use exact text to avoid ambiguity
  await expect(summarySection.getByText('loss', { exact: true }).or(summarySection.getByText('loss:'))).toBeVisible({ timeout: 10_000 });
});
