import { test, expect } from '../../../fixtures';

test('define-metric-glob: glob pattern applies custom x-axis to matching metrics', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;
  const run = sdkData.runs[4]; // "glob-pattern" run

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/runs/${run.id}`);
  await page.getByRole('tab', { name: 'Charts' }).waitFor();
  await page.waitForTimeout(2000);

  // Sections may be collapsed — expand "train" section if it's collapsed
  const trainExpand = page.getByRole('button', { name: /Expand train/ });
  if (await trainExpand.isVisible().catch(() => false)) {
    await trainExpand.click();
    await page.waitForTimeout(1000);
  }

  // Verify chart panels exist for train/* metrics
  await expect(page.getByText('train/loss').first()).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText('train/accuracy').first()).toBeVisible({ timeout: 10_000 });

  // Expand val section if collapsed
  const valExpand = page.getByRole('button', { name: /Expand val/ });
  if (await valExpand.isVisible().catch(() => false)) {
    await valExpand.click();
    await page.waitForTimeout(1000);
  }

  await expect(page.getByText('val/loss').first()).toBeVisible({ timeout: 10_000 });
});
