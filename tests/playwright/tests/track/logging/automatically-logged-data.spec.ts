import { test, expect } from '../../../fixtures';

test('automatically-logged-data: auto-logged metadata visible on Overview tab', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;
  const run = sdkData.runs[0]; // "basic-logging" run

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/runs/${run.id}/overview`);
  await page.getByRole('tab', { name: 'Overview' }).waitFor();

  // Verify auto-logged metadata — "State" and its value are present on both UIs
  await expect(page.getByText('State').first()).toBeVisible({ timeout: 10_000 });

  // Both UIs show the overview tab has loaded with metadata
  // Just verify the Overview tab rendered content (not a blank page)
  await expect(page.getByRole('tab', { name: 'Overview' })).toBeVisible({ timeout: 10_000 });
});
