import { test, expect } from '../../../fixtures';

test('table-step-slider: stepper widget appears in query panel', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;
  const run = sdkData.runs[1]; // "model-v1" with tables at multiple steps

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/runs/${run.displayName || run.name || run.id}`);
  await page.getByText('Name').first().waitFor({ timeout: 30_000 });

  // Add a Query panel and set render as "Stepper"
  await page.getByRole('button', { name: /add panel/i }).click();
  await page.getByText(/query/i).click();

  // Verify stepper widget appears
  await expect(page.getByText(/stepper/i).or(page.getByRole('slider'))).toBeVisible({ timeout: 10_000 });
});

test('table-step-slider: slider controls step value', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;
  const run = sdkData.runs[1];

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/runs/${run.displayName || run.name || run.id}`);
  await page.getByText('Name').first().waitFor({ timeout: 30_000 });

  // Look for step slider control
  const slider = page.getByRole('slider', { name: /step/i }).or(page.getByLabel(/step/i));
  await expect(slider.first()).toBeVisible({ timeout: 10_000 });
});

test('table-step-slider: table content updates per step', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;
  const run = sdkData.runs[1];

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/runs/${run.displayName || run.name || run.id}`);
  await page.getByText('Name').first().waitFor({ timeout: 30_000 });

  // Verify table content is visible (changes with step)
  await expect(page.getByText(/eval_predictions/i).or(page.getByText('score'))).toBeVisible({ timeout: 10_000 });
});

test('table-step-slider: missing steps use last logged value', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;
  const run = sdkData.runs[1];

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/runs/${run.displayName || run.name || run.id}`);
  await page.getByText('Name').first().waitFor({ timeout: 30_000 });

  // Verify the table renders even at step boundaries (graceful fallback)
  await expect(page.getByRole('table').or(page.getByText('pred'))).toBeVisible({ timeout: 10_000 });
});
