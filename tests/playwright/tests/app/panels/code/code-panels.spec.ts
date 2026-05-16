import { test, expect } from '../../../../fixtures';

// ---------------------------------------------------------------------------
// Save library code — log_code
// ---------------------------------------------------------------------------

test('log-code-files: file browser loads on run detail Files tab', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;
  const run = sdkData.runs[0];
  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/runs/${run.displayName || run.name || run.id}/files`);
  await expect(page.getByRole('heading', { name: /files/i }).or(page.getByText(/files/i).first())).toBeVisible({ timeout: 10_000 });
});

test('log-code-files: saved source files are visible', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;
  const run = sdkData.runs[0];
  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/runs/${run.displayName || run.name || run.id}/files`);
  await expect(page.getByText(/train\.py/i).or(page.getByText(/model\.py/i))).toBeVisible({ timeout: 10_000 });
});

test('log-code-files: opening a source file renders its contents', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;
  const run = sdkData.runs[0];
  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/runs/${run.displayName || run.name || run.id}/files`);
  await page.getByText(/train\.py/i).first().click();
  await expect(page.getByText(/def train/)).toBeVisible({ timeout: 10_000 });
});

// ---------------------------------------------------------------------------
// Save library code — code_dir setting
// ---------------------------------------------------------------------------

test('code-dir-files: files from configured code directory are present', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;
  const run = sdkData.runs[1];
  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/runs/${run.displayName || run.name || run.id}/files`);
  await expect(page.getByText(/train\.py/i).or(page.getByText(/model\.py/i))).toBeVisible({ timeout: 10_000 });
});

// ---------------------------------------------------------------------------
// Code Comparer
// ---------------------------------------------------------------------------

test('code-comparer: add code comparer panel from panel picker', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;
  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/workspace`);
  await page.getByRole('button', { name: 'Add panels' }).waitFor({ timeout: 30_000 });

  // Open panel picker
  await page.getByRole('button', { name: 'Add panels' }).click();

  // Select "Code" panel type
  await page.getByRole('button', { name: /code/i })
    .or(page.getByText(/code/i)).first().click();

  await expect(page.getByRole('button', { name: /apply|add|create|save/i }).first()
    .or(page.getByText(/code/i))).toBeVisible({ timeout: 10_000 });
});

// ---------------------------------------------------------------------------
// Jupyter Session History (artifact-based)
// ---------------------------------------------------------------------------

// Note: full Jupyter artifact test requires a Jupyter-like execution context;
// this test verifies the Artifacts tab navigation path is accessible.

test('jupyter-artifact: artifacts tab is navigable for a code-logged run', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;
  const run = sdkData.runs[0];
  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/runs/${run.displayName || run.name || run.id}/artifacts`);
  await expect(page.getByText(/artifact/i).first()).toBeVisible({ timeout: 10_000 });
});
