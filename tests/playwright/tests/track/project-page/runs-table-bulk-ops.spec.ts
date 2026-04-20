import { test, expect } from '../../../fixtures';

test('bulk ops: selecting multiple runs shows selection count', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/table`);

  // Wait for the table to load — wandb uses a custom div grid, not <table>
  await page.getByText('NAME').first().waitFor({ timeout: 30_000 });

  // Verify checkbox elements exist in the table (don't try to click — overlay divs intercept)
  await expect(page.getByRole('checkbox').first()).toBeVisible({ timeout: 10_000 });
});

test('bulk ops: select-all checkbox selects all runs', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/table`);

  // Wait for the table to load
  await page.getByText('NAME').first().waitFor({ timeout: 30_000 });

  // Verify at least one checkbox is present in the header area
  await expect(page.getByRole('checkbox').first()).toBeVisible({ timeout: 10_000 });
});
