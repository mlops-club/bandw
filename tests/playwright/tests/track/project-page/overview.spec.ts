import { test, expect } from '../../../fixtures';

test('overview: project name is displayed', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/overview`);

  // Verify the project name appears on the overview page
  await expect(page.getByText(sdkData.project).first()).toBeVisible({ timeout: 10_000 });
});

test('overview: contributor count is shown', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/overview`);

  // At least 1 contributor should be visible
  await expect(page.getByText(/contributor/i)).toBeVisible({ timeout: 10_000 });
});

test('overview: total runs count is shown', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/overview`);

  // The overview shows "Total runs" label with the count "5" as separate elements
  await expect(page.getByText('Total runs')).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText('5', { exact: true }).first()).toBeVisible({ timeout: 10_000 });
});
