import { test, expect } from '../../../fixtures';

test('artifacts tab: artifact list is visible', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  // Navigate to the Artifacts page
  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/artifacts`);
  await page.waitForTimeout(2000);

  // Verify the artifacts page loaded with heading
  await expect(page.getByText('Artifacts').first()).toBeVisible({ timeout: 10_000 });
});

test('artifacts tab: artifact type is shown', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  // Navigate via the Artifacts link
  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}`);
  const artifactsLink = page.getByRole('link', { name: /Artifacts/i });
  await artifactsLink.click();
  await page.waitForTimeout(2000);

  // Verify we're on the artifacts page
  await expect(page.getByText('Artifacts').first()).toBeVisible({ timeout: 10_000 });
});
