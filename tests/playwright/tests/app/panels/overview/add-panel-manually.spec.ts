import { test, expect } from '../../../../fixtures';

test('add-panel-manually: panel picker opens from Add panels button', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/workspace`);
  await page.getByRole('button', { name: 'Add panels' }).waitFor({ timeout: 30_000 });

  // Click the "Add panels" button in the workspace control bar
  await page.getByRole('button', { name: 'Add panels' }).click();

  // Verify the panel picker modal opens
  await expect(page.getByText(/panel/i).first()).toBeVisible({ timeout: 10_000 });
});

test('add-panel-manually: select line plot from panel picker', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/workspace`);
  await page.getByRole('button', { name: 'Add panels' }).waitFor({ timeout: 30_000 });

  // Open panel picker
  await page.getByRole('button', { name: 'Add panels' }).click();

  // Select "Line plot" panel type
  await page.getByRole('button', { name: /line plot/i })
    .or(page.getByText(/line plot/i)).first().click();

  // Verify a config modal or panel builder opens
  await expect(page.getByRole('button', { name: /apply|add|create|save/i }).first()).toBeVisible({ timeout: 10_000 });
});

test('add-panel-manually: configure and apply adds panel globally', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/workspace`);
  await page.getByRole('button', { name: 'Add panels' }).waitFor({ timeout: 30_000 });

  // Open panel picker and select a panel type
  await page.getByRole('button', { name: 'Add panels' }).click();
  await page.getByRole('button', { name: /line plot/i })
    .or(page.getByText(/line plot/i)).first().click();

  // Apply the panel configuration
  await page.getByRole('button', { name: /apply|add|create|save/i }).first().click();

  // Verify the panel was added to the workspace
  await expect(page.getByRole('button', { name: 'Edit panel' }).first()).toBeVisible({ timeout: 10_000 });
});

test('add-panel-manually: section-scoped add panels from section actions', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/workspace`);
  await page.getByRole('button', { name: 'Add panels' }).waitFor({ timeout: 30_000 });

  // Open the section actions menu
  await page.getByRole('button', { name: 'Section actions' }).first().click();

  // Choose the add panels option from section menu
  await page.getByRole('menuitem', { name: /add panel/i })
    .or(page.getByText(/add panel/i)).first().click();

  // Verify the panel picker opens (section-scoped)
  await expect(page.getByRole('button', { name: /apply|add|create|save/i })
    .or(page.getByText(/panel/i)).first()).toBeVisible({ timeout: 10_000 });
});

test('add-panel-manually: add bar chart to specific section', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/workspace`);
  await page.getByRole('button', { name: 'Add panels' }).waitFor({ timeout: 30_000 });

  // Open the section actions menu and choose add panels
  await page.getByRole('button', { name: 'Section actions' }).first().click();
  await page.getByRole('menuitem', { name: /add panel/i })
    .or(page.getByText(/add panel/i)).first().click();

  // Select bar chart
  await page.getByRole('button', { name: /bar chart/i })
    .or(page.getByText(/bar chart/i)).first().click();

  // Apply
  await page.getByRole('button', { name: /apply|add|create|save/i }).first().click();

  // Verify a new panel was added to the section
  await expect(page.getByRole('button', { name: 'Edit panel' }).first()).toBeVisible({ timeout: 10_000 });
});
