import { test, expect } from '../../../fixtures';

test('summary-overview: displays explicit and auto-generated summary metrics', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;
  const run = sdkData.runs[0]; // "summary-explicit"

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/runs/${run.id}/overview`);
  await page.getByRole('tab', { name: 'Overview' }).waitFor();

  // Scroll down to reveal Config and Summary sections
  await page.keyboard.press('End');
  await page.waitForTimeout(1000);

  // Verify Summary section exists with our explicit key
  const summarySection = page.getByRole('list').filter({ hasText: 'Summary metrics' });
  await expect(summarySection).toBeVisible({ timeout: 10_000 });
  await expect(summarySection.getByText('best_accuracy')).toBeVisible();
  await expect(summarySection.getByText('0.95')).toBeVisible();
});
