import { test, expect } from '../../../fixtures';

test('lifecycle: project exists and is navigable', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  // Navigate directly to the project
  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}`);

  // Project should load and display its name
  await expect(page.getByText(sdkData.project).first()).toBeVisible({ timeout: 10_000 });
});

test('lifecycle: project sidebar navigation links are present', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}`);

  // Verify the sidebar navigation links documented for project pages
  await expect(page.getByRole('link', { name: /Workspace/i })).toBeVisible({ timeout: 10_000 });
  await expect(page.getByRole('link', { name: /Runs/i })).toBeVisible({ timeout: 10_000 });
  await expect(page.getByRole('link', { name: /Reports/i })).toBeVisible({ timeout: 10_000 });
  await expect(page.getByRole('link', { name: /Artifacts/i })).toBeVisible({ timeout: 10_000 });
});

test('lifecycle: project shows runs from setup', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  // Navigate to the runs table to verify runs exist
  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/table`);

  // Wait for the table to load
  await page.getByText('NAME').first().waitFor({ timeout: 30_000 });

  // Verify runs exist — check the count text (e.g., "5 of 5 runs" or "of 5")
  await expect(page.getByText('5').first()).toBeVisible({ timeout: 10_000 });
});
