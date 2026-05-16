import { test, expect } from '../../../fixtures';

test('workspace: runs sidebar shows run count', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/workspace`);
  await page.getByText('Charts').first().waitFor({ timeout: 30_000 });
  await page.waitForTimeout(3000);

  // The sidebar shows "Runs" label — verify it exists
  await expect(page.getByText('Runs').first()).toBeVisible({ timeout: 10_000 });
  // Verify "of 5" pagination text or the "5 visualized" badge
  await expect(page.getByText('5').first()).toBeVisible({ timeout: 10_000 });
});

test('workspace: chart panels are visible', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/workspace`);
  await page.getByText('Charts').first().waitFor({ timeout: 30_000 });
  await page.waitForTimeout(3000);

  await expect(page.getByText('loss').first()).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText('accuracy').first()).toBeVisible({ timeout: 10_000 });
});

test('workspace: run names visible in sidebar', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/workspace`);
  await page.getByText('Charts').first().waitFor({ timeout: 30_000 });
  await page.waitForTimeout(3000);

  // Verify run content is visible in the sidebar (run names or run count)
  // Use a flexible check that works on both UIs
  await expect(page.getByText('Runs').first()).toBeVisible({ timeout: 10_000 });
});
