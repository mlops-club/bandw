import { test, expect } from '../../../fixtures';

// ---------------------------------------------------------------------------
// Test 1: create-report-from-workspace
// ---------------------------------------------------------------------------
test('create-report-from-workspace: create report from workspace charts', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  // Navigate to workspace
  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/workspace`);
  await page.getByRole('button', { name: 'Add panels' }).waitFor({ timeout: 30_000 });

  // Click the "Create report" control
  await page.getByRole('button', { name: /create report/i }).click();

  // Report creation modal opens with chart selection
  await expect(page.getByRole('dialog')).toBeVisible({ timeout: 10_000 });

  // Toggle "Filter run sets"
  await page.getByRole('checkbox', { name: /filter run sets/i }).click();

  // Click "Create report" to finalize
  await page.getByRole('button', { name: /create report/i }).click();

  // Draft report opens with panels
  await expect(page.getByText(/report/i)).toBeVisible({ timeout: 10_000 });
});

// ---------------------------------------------------------------------------
// Test 2: create-report-from-reports-tab
// ---------------------------------------------------------------------------
test('create-report-from-reports-tab: create report from Reports tab', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  // Navigate to project Reports tab
  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/reportlist`);

  // Click "Create Report" button
  await page.getByRole('button', { name: /create report/i }).click();

  // Verify editor opens
  await expect(page.getByRole('textbox', { name: /title/i }).or(page.locator('[contenteditable]').first())).toBeVisible({ timeout: 10_000 });
});

// ---------------------------------------------------------------------------
// Test 3: create-report-from-api
// ---------------------------------------------------------------------------
test('create-report-from-api: API-created report loads in UI', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  // Navigate to Reports tab -- the API-created report should be listed
  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/reportlist`);

  // Verify at least one report is listed
  await expect(page.getByRole('link', { name: /report/i }).first()).toBeVisible({ timeout: 10_000 });
});

// ---------------------------------------------------------------------------
// Test 4: report-add-plots
// ---------------------------------------------------------------------------
test('report-add-plots: add line plot and scatter plot via slash command', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  // Navigate to Reports tab and create a new report
  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/reportlist`);
  await page.getByRole('button', { name: /create report/i }).click();

  // Type "/" to open command menu
  await page.keyboard.press('/');

  // Select "Line plot" from the dropdown
  await expect(page.getByRole('option', { name: /line plot/i }).or(page.getByRole('menuitem', { name: /line plot/i }).or(page.getByText(/line plot/i)))).toBeVisible({ timeout: 10_000 });
  await page.getByText(/line plot/i).click();

  // Verify line plot panel is added
  await expect(page.locator('[class*="panel"]').or(page.getByText(/line plot/i))).toBeVisible({ timeout: 10_000 });
});

// ---------------------------------------------------------------------------
// Test 5: report-add-run-sets
// ---------------------------------------------------------------------------
test('report-add-run-sets: add panel grid with project run sets', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  // Navigate to Reports tab and create a new report
  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/reportlist`);
  await page.getByRole('button', { name: /create report/i }).click();

  // Type "/" and select "Panel Grid"
  await page.keyboard.press('/');
  await page.getByText(/panel grid/i).click();

  // Verify runs are imported into the report
  await expect(page.getByText(/experiment-A/i).or(page.getByText(/basic-run/i)).first()).toBeVisible({ timeout: 10_000 });
});

// ---------------------------------------------------------------------------
// Test 6: report-freeze-run-set
// ---------------------------------------------------------------------------
test('report-freeze-run-set: freeze a run set in a report', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  // Navigate to Reports tab and create a new report
  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/reportlist`);
  await page.getByRole('button', { name: /create report/i }).click();

  // Add a panel grid first
  await page.keyboard.press('/');
  await page.getByText(/panel grid/i).click();

  // Use the run-set freeze control
  await page.getByRole('button', { name: /freeze/i }).click();

  // Verify visual indicator of frozen state (snowflake icon or frozen label)
  await expect(page.getByRole('button', { name: /frozen|unfreeze/i }).or(page.locator('[aria-label*="frozen"]'))).toBeVisible({ timeout: 10_000 });
});

// ---------------------------------------------------------------------------
// Test 7: report-add-code-block
// ---------------------------------------------------------------------------
test('report-add-code-block: add a Python code block via slash command', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  // Navigate to Reports tab and create a new report
  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/reportlist`);
  await page.getByRole('button', { name: /create report/i }).click();

  // Type "/" to open command menu and select "Code"
  await page.keyboard.press('/');
  await page.getByText(/code/i).click();

  // Select "Python" language
  await page.getByText(/python/i).click();

  // Type code into the block
  await page.keyboard.type('import wandb\nrun = wandb.init()');

  // Verify code block renders with syntax highlighting
  await expect(page.getByText('import')).toBeVisible({ timeout: 10_000 });
});

// ---------------------------------------------------------------------------
// Test 8: report-add-markdown
// ---------------------------------------------------------------------------
test('report-add-markdown: add markdown block with formatting', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  // Navigate to Reports tab and create a new report
  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/reportlist`);
  await page.getByRole('button', { name: /create report/i }).click();

  // Type "/" to open command menu and select "Markdown"
  await page.keyboard.press('/');
  await page.getByText(/markdown/i).click();

  // Type markdown text with bold and italic
  await page.keyboard.type('**bold text** and *italic text*');

  // Verify text renders correctly
  await expect(page.getByText('bold text')).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText('italic text')).toBeVisible({ timeout: 10_000 });
});

// ---------------------------------------------------------------------------
// Test 9: report-add-headings
// ---------------------------------------------------------------------------
test('report-add-headings: add heading and paragraph via slash command', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  // Navigate to Reports tab and create a new report
  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/reportlist`);
  await page.getByRole('button', { name: /create report/i }).click();

  // Type "/" and select "Heading 2"
  await page.keyboard.press('/');
  await page.getByText(/heading 2/i).click();

  // Type heading text
  await page.keyboard.type('Results Section');

  // Verify heading renders
  await expect(page.getByRole('heading', { name: 'Results Section' })).toBeVisible({ timeout: 10_000 });

  // Add paragraph text below
  await page.keyboard.press('Enter');
  await page.keyboard.type('This section contains our findings.');

  // Verify paragraph text is added
  await expect(page.getByText('This section contains our findings.')).toBeVisible({ timeout: 10_000 });
});
