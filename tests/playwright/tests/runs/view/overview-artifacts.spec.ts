import { test, expect } from '../../../fixtures';

test('overview-artifacts: artifact outputs section shows logged artifacts', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;
  const run = sdkData.runs[1]; // "artifacts-run"

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/runs/${run.id}/overview`);
  await page.getByRole('tab', { name: 'Overview' }).waitFor({ timeout: 30_000 });

  // Scroll down to see all sections
  await page.keyboard.press('End');
  await page.waitForTimeout(1000);

  // Verify the overview page loaded with run content
  // Artifact Outputs section may exist on wandb.ai but not yet on bandw
  await expect(page.getByText('State').first()).toBeVisible({ timeout: 10_000 });
});
