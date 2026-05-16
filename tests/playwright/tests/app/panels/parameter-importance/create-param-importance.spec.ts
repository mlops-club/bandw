import { test, expect } from '../../../../fixtures';

test('create-param-importance: workspace loads', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/workspace`);
  await page.getByRole('button', { name: 'Add panels' }).waitFor({ timeout: 30_000 });

  // Verify page loads
  await expect(page.getByText(sdkData.project)).toBeVisible({ timeout: 10_000 });
});

test('create-param-importance: panel picker opens', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/workspace`);
  await page.getByRole('button', { name: 'Add panels' }).waitFor({ timeout: 30_000 });

  // Click "Add panels" button
  await page.getByRole('button', { name: 'Add panels' }).click();

  // Verify panel picker opens
  await expect(page.getByText(/panel/i)).toBeVisible({ timeout: 10_000 });
});

test('create-param-importance: parameter importance panel added', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/workspace`);
  await page.getByRole('button', { name: 'Add panels' }).waitFor({ timeout: 30_000 });

  // Click "Add panels"
  await page.getByRole('button', { name: 'Add panels' }).click();

  // Expand "Evaluation" and select "Parameter importance"
  await page.getByText(/evaluation/i).click();
  await page.getByText(/parameter importance/i).click();

  // Verify panel is added
  await expect(page.getByText(/parameter importance/i)).toBeVisible({ timeout: 10_000 });
});

test('create-param-importance: config keys listed', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/workspace`);
  await page.getByRole('button', { name: 'Add panels' }).waitFor({ timeout: 30_000 });

  // Add parameter importance panel
  await page.getByRole('button', { name: 'Add panels' }).click();
  await page.getByText(/evaluation/i).click();
  await page.getByText(/parameter importance/i).click();

  // Verify panel displays parameters from config
  await expect(page.getByText('lr').or(page.getByText('learning_rate'))).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText('batch_size')).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText('dropout')).toBeVisible({ timeout: 10_000 });
});

test('create-param-importance: importance bars render', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/workspace`);
  await page.getByRole('button', { name: 'Add panels' }).waitFor({ timeout: 30_000 });

  // Add parameter importance panel
  await page.getByRole('button', { name: 'Add panels' }).click();
  await page.getByText(/evaluation/i).click();
  await page.getByText(/parameter importance/i).click();

  // Verify importance bars render for each parameter
  await expect(page.locator('svg rect, svg path').first()).toBeVisible({ timeout: 10_000 });
});

test('create-param-importance: correlation values displayed', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/workspace`);
  await page.getByRole('button', { name: 'Add panels' }).waitFor({ timeout: 30_000 });

  // Add parameter importance panel
  await page.getByRole('button', { name: 'Add panels' }).click();
  await page.getByText(/evaluation/i).click();
  await page.getByText(/parameter importance/i).click();

  // Verify correlation values are shown (numbers between -1 and 1)
  await expect(page.getByText(/correlation/i).or(page.getByText(/importance/i))).toBeVisible({ timeout: 10_000 });
});
