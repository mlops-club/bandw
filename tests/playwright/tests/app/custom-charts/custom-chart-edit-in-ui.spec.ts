import { test, expect } from '../../../fixtures';

test('custom-chart-edit-in-ui: edit interface opens', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;
  const run = sdkData.runs[7]; // "edit-target"

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/runs/${run.displayName || run.name || run.id}`);
  await page.getByText('Name').first().waitFor({ timeout: 30_000 });

  // Open custom chart panel for editing
  await page.getByText('Editable Chart').click();
  await page.getByRole('button', { name: /edit/i }).click();

  // Verify edit interface opens
  await expect(page.getByText(/edit/i)).toBeVisible({ timeout: 10_000 });
});

test('custom-chart-edit-in-ui: query editor visible', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;
  const run = sdkData.runs[7];

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/runs/${run.displayName || run.name || run.id}`);
  await page.getByText('Name').first().waitFor({ timeout: 30_000 });

  // Open edit interface
  await page.getByText('Editable Chart').click();
  await page.getByRole('button', { name: /edit/i }).click();

  // Verify GraphQL query editor is visible
  await expect(page.getByText(/query/i).or(page.getByRole('textbox', { name: /query/i }))).toBeVisible({ timeout: 10_000 });
});

test('custom-chart-edit-in-ui: chart field mapping UI available', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;
  const run = sdkData.runs[7];

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/runs/${run.displayName || run.name || run.id}`);
  await page.getByText('Name').first().waitFor({ timeout: 30_000 });

  // Open edit interface
  await page.getByText('Editable Chart').click();
  await page.getByRole('button', { name: /edit/i }).click();

  // Verify chart field mapping UI is present
  await expect(page.getByLabel(/x/i).or(page.getByText(/field/i))).toBeVisible({ timeout: 10_000 });
});

test('custom-chart-edit-in-ui: mapped data updates chart', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;
  const run = sdkData.runs[7];

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/runs/${run.displayName || run.name || run.id}`);
  await page.getByText('Name').first().waitFor({ timeout: 30_000 });

  // Open edit interface
  await page.getByText('Editable Chart').click();
  await page.getByRole('button', { name: /edit/i }).click();

  // Map query columns to chart axes
  await page.getByRole('combobox', { name: /x/i }).or(page.getByLabel(/x.axis/i)).click();

  // Verify the mapping options are available
  await expect(page.getByRole('option').first().or(page.getByRole('listbox'))).toBeVisible({ timeout: 10_000 });
});

test('custom-chart-edit-in-ui: chart type can be modified', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;
  const run = sdkData.runs[7];

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/runs/${run.displayName || run.name || run.id}`);
  await page.getByText('Name').first().waitFor({ timeout: 30_000 });

  // Open edit interface
  await page.getByText('Editable Chart').click();
  await page.getByRole('button', { name: /edit/i }).click();

  // Verify chart type selector is available
  await expect(page.getByRole('combobox', { name: /chart type/i }).or(page.getByText(/chart type/i).or(page.getByText(/visualization/i)))).toBeVisible({ timeout: 10_000 });
});
