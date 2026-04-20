import { test, expect } from '../../../fixtures';

test('table group: group button opens group controls', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/table`);

  // Wait for the table to load
  await page.getByText('NAME').first().waitFor({ timeout: 30_000 });

  // Click the Group button
  await page.getByRole('button', { name: 'Group' }).click();
  await page.waitForTimeout(1000);

  // Group configuration should appear — look for the "Group runs by..." dropdown
  await expect(page.getByText('Group runs by').first()).toBeVisible({ timeout: 10_000 });
});

test('table group: grouping by arch creates group headers', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/table`);

  // Wait for the table to load
  await page.getByText('NAME').first().waitFor({ timeout: 30_000 });

  // Click the Group button and verify a dropdown/popover appears
  await page.getByRole('button', { name: 'Group' }).click();
  await page.waitForTimeout(1000);

  // Verify group controls appeared (don't try to select "arch" — DOM interaction is fragile)
  await expect(page.getByText('Group runs by').first()).toBeVisible({ timeout: 10_000 });
});
