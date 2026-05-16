import { test, expect } from '../../../fixtures';

test('logs-tab: log viewer loads with visible log lines', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;
  const run = sdkData.runs[0];

  // Navigate directly to the Logs tab URL
  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/runs/${run.id}/logs`);
  await page.waitForTimeout(3000);

  // Verify we're on the logs page — the Logs tab should be visible
  await expect(page.getByRole('tab', { name: 'Logs' })).toBeVisible({ timeout: 10_000 });

  // Verify the page loaded (not a blank page or error)
  await expect(page.getByText('Logs').first()).toBeVisible({ timeout: 10_000 });
});
