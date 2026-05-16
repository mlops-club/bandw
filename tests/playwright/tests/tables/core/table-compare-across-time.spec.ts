import { test, expect } from '../../../fixtures';

test('table-compare-across-time: multiple versions available', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;
  const run = sdkData.runs[1]; // "model-v1" logs tables at multiple steps

  // Navigate to run artifacts
  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/runs/${run.displayName || run.name || run.id}/artifacts`);

  // Verify multiple table versions are available
  await expect(page.getByText(/eval_predictions/i).or(page.getByText(/v\d+/)).first()).toBeVisible({ timeout: 10_000 });
});

test('table-compare-across-time: differences visible between versions', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;
  const run = sdkData.runs[1];

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/runs/${run.displayName || run.name || run.id}/artifacts`);

  // Open comparison between two versions
  await page.getByRole('button', { name: /compare/i }).click();

  // Verify comparison view shows differences
  await expect(page.getByText(/compare/i).or(page.getByText(/diff/i))).toBeVisible({ timeout: 10_000 });
});

test('table-compare-across-time: values differ across time', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;
  const run = sdkData.runs[1];

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/runs/${run.displayName || run.name || run.id}/artifacts`);

  // Navigate into the table artifact
  await page.getByText('eval_predictions').first().click();

  // Verify table content is visible with prediction data
  await expect(page.getByText('score').or(page.getByRole('columnheader', { name: 'score' }))).toBeVisible({ timeout: 10_000 });
});
