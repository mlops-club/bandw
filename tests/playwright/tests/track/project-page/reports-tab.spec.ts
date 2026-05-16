import { test, expect } from '../../../fixtures';

test('reports tab: reports list or empty state is visible', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  // Navigate directly to the reportlist URL
  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/reportlist`);
  await page.waitForTimeout(3000);

  // Verify the page loaded with "Reports" text visible
  await expect(page.getByText(/report/i).first()).toBeVisible({ timeout: 10_000 });
});

test('reports tab: create report button is accessible', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/reportlist`);
  await page.waitForTimeout(3000);

  // A button to create a new report should be available — use data-test attribute or first match
  await expect(
    page.locator('[data-test="create-report-button"]')
      .or(page.getByRole('button', { name: /Create report/i }).first())
      .or(page.getByRole('link', { name: /Create report/i }).first())
  ).toBeVisible({ timeout: 10_000 });
});
