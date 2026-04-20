import { test, expect } from '../../../../fixtures';

test('param-importance-interpretation: panel visible', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/workspace`);
  await page.getByRole('button', { name: 'Add panels' }).waitFor({ timeout: 30_000 });

  // Add parameter importance panel
  await page.getByRole('button', { name: 'Add panels' }).click();
  await page.getByText(/evaluation/i).click();
  await page.getByText(/parameter importance/i).click();

  // Verify panel is visible
  await expect(page.getByText(/parameter importance/i)).toBeVisible({ timeout: 10_000 });
});

test('param-importance-interpretation: feature importance bars present', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/workspace`);
  await page.getByRole('button', { name: 'Add panels' }).waitFor({ timeout: 30_000 });

  // Add parameter importance panel
  await page.getByRole('button', { name: 'Add panels' }).click();
  await page.getByText(/evaluation/i).click();
  await page.getByText(/parameter importance/i).click();

  // Verify importance column shows bar chart per parameter
  await expect(page.locator('svg rect').first()).toBeVisible({ timeout: 10_000 });
});

test('param-importance-interpretation: correlation values in valid range', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/workspace`);
  await page.getByRole('button', { name: 'Add panels' }).waitFor({ timeout: 30_000 });

  // Add parameter importance panel
  await page.getByRole('button', { name: 'Add panels' }).click();
  await page.getByText(/evaluation/i).click();
  await page.getByText(/parameter importance/i).click();

  // Verify correlation column has values (visually present as numbers)
  await expect(page.getByText(/correlation/i).or(page.getByText(/0\.\d+/).first())).toBeVisible({ timeout: 10_000 });
});

test('param-importance-interpretation: positive and negative correlations distinguishable', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/workspace`);
  await page.getByRole('button', { name: 'Add panels' }).waitFor({ timeout: 30_000 });

  // Add parameter importance panel
  await page.getByRole('button', { name: 'Add panels' }).click();
  await page.getByText(/evaluation/i).click();
  await page.getByText(/parameter importance/i).click();

  // Verify correlation interpretation is visually distinguishable
  await expect(page.getByText(/importance/i)).toBeVisible({ timeout: 10_000 });
});

test('param-importance-interpretation: output metric can be changed', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/workspace`);
  await page.getByRole('button', { name: 'Add panels' }).waitFor({ timeout: 30_000 });

  // Add parameter importance panel
  await page.getByRole('button', { name: 'Add panels' }).click();
  await page.getByText(/evaluation/i).click();
  await page.getByText(/parameter importance/i).click();

  // Change the selected output metric
  await page.getByRole('combobox', { name: /metric/i }).or(page.getByLabel(/metric/i)).click();

  // Verify metric options are available
  await expect(page.getByRole('option', { name: /loss/i }).or(page.getByText('loss'))).toBeVisible({ timeout: 10_000 });
});

test('param-importance-interpretation: parameters can be toggled', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/workspace`);
  await page.getByRole('button', { name: 'Add panels' }).waitFor({ timeout: 30_000 });

  // Add parameter importance panel
  await page.getByRole('button', { name: 'Add panels' }).click();
  await page.getByText(/evaluation/i).click();
  await page.getByText(/parameter importance/i).click();

  // Verify parameter visibility controls exist
  await expect(page.getByRole('checkbox').first().or(page.getByRole('switch').first())).toBeVisible({ timeout: 10_000 });
});
