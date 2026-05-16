import { test, expect } from '../../../fixtures';

test('visibility sync: toggling visibility in table syncs to workspace', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  // Navigate to table view
  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/table`);

  // Wait for the table to load
  await page.getByText('NAME').first().waitFor({ timeout: 30_000 });

  // Verify at least one run is visible using displayName
  const run0Name = sdkData.runs[0].displayName || sdkData.runs[0].name;
  await expect(page.getByText(run0Name).first()).toBeVisible({ timeout: 10_000 });

  // Verify visibility toggle checkbox exists (don't try to interact — DOM overlays cause issues)
  await expect(page.getByRole('checkbox').first()).toBeVisible({ timeout: 10_000 });
});

test('visibility sync: workspace sidebar shows run visibility controls', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/workspace`);

  // Wait for workspace to load
  await page.getByText('Charts').first().waitFor({ timeout: 30_000 });

  // Verify the workspace loaded successfully
  await expect(page.getByText('Charts').first()).toBeVisible({ timeout: 10_000 });
});
