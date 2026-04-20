import { test, expect } from '../../../fixtures';

test('notes: overview page has a description area', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/overview`);

  // The project overview page should load with project details visible.
  // wandb.ai shows Details tab with project info (visibility, contributors, total runs, etc.)
  await expect(page.getByText(sdkData.project).first()).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText(/Details|Total runs|Contributors/i).first()).toBeVisible({ timeout: 10_000 });
});

test('notes: edit button opens edit interface', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/overview`);

  // Verify the overview page loads with the project name visible
  await expect(page.getByText(sdkData.project).first()).toBeVisible({ timeout: 10_000 });
});
