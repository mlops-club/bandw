import { test, expect } from '../../../fixtures';

test('charts-tab: chart panels exist for logged metrics', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;
  const run = sdkData.runs[0]; // "basic-run"

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/runs/${run.id}`);

  // Navigate to Charts tab
  const chartsTab = page.getByRole('tab', { name: 'Charts' });
  await chartsTab.waitFor({ timeout: 30_000 });
  await chartsTab.click();

  // Wait for chart content to load
  await page.waitForTimeout(2000);

  // Chart sections may be collapsed; check for expand buttons before asserting panel titles
  const expandButtons = page.getByRole('button', { name: /expand/i });
  const expandCount = await expandButtons.count();
  for (let i = 0; i < expandCount; i++) {
    await expandButtons.nth(i).click();
    await page.waitForTimeout(500);
  }

  // Verify chart panels exist for logged metrics using text locator with first()
  await expect(page.getByText('loss').first()).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText('accuracy').first()).toBeVisible({ timeout: 10_000 });
});
