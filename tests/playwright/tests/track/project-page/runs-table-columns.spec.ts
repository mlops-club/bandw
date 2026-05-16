import { test, expect } from '../../../fixtures';

test('table columns: default columns are present', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/table`);

  // Wait for the table to load — wandb uses a custom div grid, not <table>
  await page.getByText('NAME').first().waitFor({ timeout: 30_000 });

  // Verify default column headers using text locators (not role="columnheader")
  await expect(page.getByText('NAME').first()).toBeVisible({ timeout: 10_000 });
  // Verify "State" column header text is visible (case may vary by UI)
  // Exclude the filter dropdown option "All states" by checking exact "State"
  await expect(page.getByText('State', { exact: true }).first()
    .or(page.getByText('STATE', { exact: true }).first())
  ).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText(/Created/i).first()).toBeVisible({ timeout: 10_000 });
});

test('table columns: config columns are auto-generated', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/table`);

  // Wait for the table to load
  await page.getByText('NAME').first().waitFor({ timeout: 30_000 });

  // Scroll right to reveal config columns
  await page.keyboard.press('End');
  await page.waitForTimeout(1000);

  // Config keys should appear as column headers
  await expect(page.getByText('lr').first()).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText('arch').first()).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText('batch_size').first()).toBeVisible({ timeout: 10_000 });
});

test('table columns: summary columns are auto-generated', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/table`);

  // Wait for the table to load
  await page.getByText('NAME').first().waitFor({ timeout: 30_000 });

  // Scroll right to reveal summary columns
  await page.keyboard.press('End');
  await page.waitForTimeout(1000);

  // Summary metric keys should appear as column headers
  await expect(page.getByText('loss').first()).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText('accuracy').first()).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText('best_accuracy').first()).toBeVisible({ timeout: 10_000 });
});
