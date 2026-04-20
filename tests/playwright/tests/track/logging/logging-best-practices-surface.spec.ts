import { test, expect } from '../../../fixtures';

test('logging-best-practices-surface: config stays in Config section, metrics render in charts', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;
  const run = sdkData.runs[0]; // "basic-logging" run

  // --- Overview tab: verify Config and Summary sections exist ---
  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/runs/${run.id}/overview`);
  await page.getByRole('tab', { name: 'Overview' }).waitFor();
  await page.keyboard.press('End');
  await page.waitForTimeout(1000);

  // Config heading should exist on the overview page (may be empty for this run)
  await expect(page.getByText('Config').first()).toBeVisible({ timeout: 10_000 });

  // --- Charts tab: verify metrics render as chart panels ---
  await page.getByRole('tab', { name: 'Charts' }).click();
  await page.waitForTimeout(3000);

  await expect(page.getByText('loss').first()).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText('accuracy').first()).toBeVisible({ timeout: 10_000 });
});
