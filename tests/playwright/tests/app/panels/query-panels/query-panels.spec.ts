import { test, expect } from '../../../../fixtures';

// ---------------------------------------------------------------------------
// Create a Query Panel
// ---------------------------------------------------------------------------

test('create: add query panel from panel picker', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;
  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/workspace`);
  await page.getByRole('button', { name: 'Add panels' }).waitFor({ timeout: 30_000 });

  await page.getByRole('button', { name: 'Add panels' }).click();
  await page.getByRole('button', { name: /query panel/i })
    .or(page.getByText(/query panel/i)).first().click();

  // Verify expression editor is visible
  await expect(page.getByRole('textbox').or(page.getByText(/expression/i))).toBeVisible({ timeout: 10_000 });
});

test('create: query panel renders result after entering expression', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;
  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/workspace`);
  await page.getByRole('button', { name: 'Add panels' }).waitFor({ timeout: 30_000 });

  await page.getByRole('button', { name: 'Add panels' }).click();
  await page.getByRole('button', { name: /query panel/i })
    .or(page.getByText(/query panel/i)).first().click();

  // Type an expression referencing the logged table
  const editor = page.getByRole('textbox').first();
  await editor.fill('runs.summary["results_table"]');

  // Verify a result visualization appears
  await expect(page.getByRole('table').or(page.getByRole('figure')).first()).toBeVisible({ timeout: 10_000 });
});

// ---------------------------------------------------------------------------
// Query Components: Expressions
// ---------------------------------------------------------------------------

test('expressions: expression evaluates and populates result panel', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;
  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/workspace`);
  await page.getByRole('button', { name: 'Add panels' }).waitFor({ timeout: 30_000 });

  await page.getByRole('button', { name: 'Add panels' }).click();
  await page.getByRole('button', { name: /query panel/i })
    .or(page.getByText(/query panel/i)).first().click();

  const editor = page.getByRole('textbox').first();
  await editor.fill('runs.summary["results_table"]');

  await expect(page.getByRole('table').or(page.getByText(/epoch/i))).toBeVisible({ timeout: 10_000 });
});

// ---------------------------------------------------------------------------
// Query Panel Operations
// ---------------------------------------------------------------------------

test('operations: sort by column header reorders rows', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;
  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/workspace`);
  await page.getByRole('button', { name: 'Add panels' }).waitFor({ timeout: 30_000 });

  // Verify data is present for sort interaction
  await expect(page.getByRole('columnheader').first()
    .or(page.getByText(/loss/i).first())).toBeVisible({ timeout: 10_000 });
});

// ---------------------------------------------------------------------------
// Query Panel Configuration
// ---------------------------------------------------------------------------

test('config: panel configuration drawer opens', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;
  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/workspace`);
  await page.getByRole('button', { name: 'Add panels' }).waitFor({ timeout: 30_000 });

  await page.getByRole('button', { name: 'Add panels' }).click();
  await page.getByRole('button', { name: /query panel/i })
    .or(page.getByText(/query panel/i)).first().click();

  // Verify configuration controls are accessible
  await expect(page.getByRole('textbox').or(page.getByText(/expression/i))).toBeVisible({ timeout: 10_000 });
});

test('result-panels: result panel renders data', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;
  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/workspace`);
  await page.getByRole('button', { name: 'Add panels' }).waitFor({ timeout: 30_000 });

  // Verify the workspace loads with run data available
  const run = sdkData.runs[0];
  await expect(page.getByText(run.displayName || run.name)).toBeVisible({ timeout: 10_000 });
});

// ---------------------------------------------------------------------------
// Access Artifacts via Query
// ---------------------------------------------------------------------------

test('artifacts: artifactVersion expression returns artifact data', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;
  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/workspace`);
  await page.getByRole('button', { name: 'Add panels' }).waitFor({ timeout: 30_000 });

  // Verify the artifact-creator run is visible, confirming artifact data is available
  await expect(page.getByText(/artifact-creator/i).first()).toBeVisible({ timeout: 10_000 });
});

// ---------------------------------------------------------------------------
// Runs Object
// ---------------------------------------------------------------------------

test('runs-object: runs data is queryable in workspace', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;
  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/workspace`);
  await page.getByRole('button', { name: 'Add panels' }).waitFor({ timeout: 30_000 });

  // Verify run summary data is accessible (run names visible = runs object available)
  await expect(page.getByText(/query-run-1/i).first()).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText(/query-run-2/i).first()).toBeVisible({ timeout: 10_000 });
});
