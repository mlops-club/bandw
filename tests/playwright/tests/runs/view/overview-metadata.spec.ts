import { test, expect } from '../../../fixtures';

test('overview-metadata: displays run metadata fields', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;
  const run = sdkData.runs[0]; // "basic-run"

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/runs/${run.id}/overview`);
  await page.getByRole('tab', { name: 'Overview' }).waitFor({ timeout: 30_000 });

  // Verify the run state is displayed (both UIs show "Finished" or "finished")
  await expect(page.getByText(/[Ff]inished/).first()).toBeVisible({ timeout: 10_000 });

  // Verify the run ID is visible somewhere on the page (breadcrumbs, metadata, etc.)
  await expect(page.getByText(run.id).first()).toBeVisible({ timeout: 10_000 });

  // Verify "State" label is present
  await expect(page.getByText('State').first()).toBeVisible({ timeout: 10_000 });

  // Verify host info is present
  await expect(page.getByText(/Host/).first()).toBeVisible({ timeout: 10_000 });
});
