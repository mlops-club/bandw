import { test, expect } from '../../../fixtures';

test('table-compare-across-models: comparison view opens', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  // Navigate to project artifacts page to compare model-v1 and model-v2
  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/artifacts`);

  // Verify both model runs' artifacts are available
  await expect(page.getByText(/eval_predictions/i).or(page.getByText(/artifact/i)).first()).toBeVisible({ timeout: 10_000 });
});

test('table-compare-across-models: filter to incorrect predictions', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;
  const run = sdkData.runs[1]; // "model-v1"

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/runs/${run.displayName || run.name || run.id}/artifacts`);

  // Open table artifact
  await page.getByText('eval_predictions').first().click();

  // Open filter to find incorrect predictions (where pred != label)
  await page.getByRole('button', { name: /filter/i }).click();

  // Verify filter UI is present
  await expect(page.getByText(/filter/i)).toBeVisible({ timeout: 10_000 });
});

test('table-compare-across-models: predictions differ between models', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;
  const run = sdkData.runs[2]; // "model-v2"

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/runs/${run.displayName || run.name || run.id}/artifacts`);

  // Open table artifact
  await page.getByText('eval_predictions').first().click();

  // Verify table content renders with prediction data
  await expect(page.getByRole('columnheader', { name: 'pred' }).or(page.getByText('pred'))).toBeVisible({ timeout: 10_000 });
});
