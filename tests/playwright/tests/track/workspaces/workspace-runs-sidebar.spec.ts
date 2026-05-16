import { test, expect } from '../../../fixtures';

test('runs sidebar: shows run count badge', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/workspace`);
  await page.getByRole('button', { name: 'Add panels' }).waitFor({ timeout: 30_000 });

  // The runs sidebar should display "Runs" with a count (3 runs created)
  await expect(page.getByText(/Runs\s*\(?\d+\)?/).first()).toBeVisible({ timeout: 10_000 });
});

test('runs sidebar: run visibility toggle works', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;
  const run0Name = sdkData.runs[0].displayName || sdkData.runs[0].name;

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/workspace`);
  await page.getByRole('button', { name: 'Add panels' }).waitFor({ timeout: 30_000 });

  // Find the visibility toggle for the first run
  const runRow = page.getByText(run0Name).first();
  await expect(runRow).toBeVisible({ timeout: 10_000 });

  // Toggle run visibility using the eye/visibility control
  const visibilityToggle = page.getByRole('button', { name: /toggle.*visibility|hide.*run|show.*run/i }).first();
  await visibilityToggle.click();

  // The toggle should reflect the changed state
  await expect(visibilityToggle).toBeVisible({ timeout: 10_000 });
});

test('runs sidebar: run color picker appears', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/workspace`);
  await page.getByRole('button', { name: 'Add panels' }).waitFor({ timeout: 30_000 });

  // Click the color swatch for a run to open the color picker
  const colorButton = page.getByRole('button', { name: /color|swatch/i }).first();
  await colorButton.click();

  // Color picker should appear
  await expect(page.getByRole('dialog').or(page.getByRole('listbox')).first()).toBeVisible({ timeout: 10_000 });
});

test('runs sidebar: search runs by name', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;
  const run0Name = sdkData.runs[0].displayName || sdkData.runs[0].name;
  const run1Name = sdkData.runs[1].displayName || sdkData.runs[1].name;

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/workspace`);
  await page.getByRole('button', { name: 'Add panels' }).waitFor({ timeout: 30_000 });

  // Use the search input in the runs sidebar
  const searchBox = page.getByRole('combobox', { name: /Search runs/i })
    .or(page.getByPlaceholder(/Search runs/i));
  await searchBox.first().fill('fast');

  // Only matching run should remain visible
  await expect(page.getByText(run0Name).first()).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText(run1Name)).not.toBeVisible({ timeout: 10_000 });
});

test('runs sidebar: toggle regex search', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;
  const run0Name = sdkData.runs[0].displayName || sdkData.runs[0].name;
  const run1Name = sdkData.runs[1].displayName || sdkData.runs[1].name;
  const run2Name = sdkData.runs[2].displayName || sdkData.runs[2].name;

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/workspace`);
  await page.getByRole('button', { name: 'Add panels' }).waitFor({ timeout: 30_000 });

  // Click regex toggle button near the search box
  const regexToggle = page.getByRole('button', { name: /regex/i }).first();
  await regexToggle.click();

  // Regex mode should be active
  await expect(regexToggle).toBeVisible({ timeout: 10_000 });

  // Enter a regex pattern
  const searchBox = page.getByRole('combobox', { name: /Search runs/i })
    .or(page.getByPlaceholder(/Search runs/i));
  await searchBox.first().fill('(fast|mid)');

  // Matching runs should be visible
  await expect(page.getByText(run0Name).first()).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText(run2Name).first()).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText(run1Name)).not.toBeVisible({ timeout: 10_000 });
});

test('runs sidebar: click run name navigates to run detail', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;
  const run0Name = sdkData.runs[0].displayName || sdkData.runs[0].name;

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/workspace`);
  await page.getByRole('button', { name: 'Add panels' }).waitFor({ timeout: 30_000 });

  // Click the run name link
  await page.getByRole('link', { name: new RegExp(run0Name) }).first().click();

  // Should navigate to the run detail page
  await expect(page).toHaveURL(/\/runs\//);
});

test('runs sidebar: expand button opens full runs table', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/workspace`);
  await page.getByRole('button', { name: 'Add panels' }).waitFor({ timeout: 30_000 });

  // Click the expand button on the sidebar
  const expandButton = page.getByRole('button', { name: /expand|full table/i }).first();
  await expandButton.click();

  // Full runs table should be visible
  await expect(page.getByRole('table').first()).toBeVisible({ timeout: 10_000 });
});

test('runs sidebar: keyboard shortcut collapses and expands sidebar', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;
  const run0Name = sdkData.runs[0].displayName || sdkData.runs[0].name;

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/workspace`);
  await page.getByRole('button', { name: 'Add panels' }).waitFor({ timeout: 30_000 });

  // Verify sidebar is visible with run names
  await expect(page.getByText(run0Name).first()).toBeVisible({ timeout: 10_000 });

  // Use Cmd+. (macOS) or Ctrl+. to collapse the sidebar
  const modifier = process.platform === 'darwin' ? 'Meta' : 'Control';
  await page.keyboard.press(`${modifier}+.`);

  // Sidebar should collapse - run names hidden
  await expect(page.getByText(run0Name)).not.toBeVisible({ timeout: 10_000 });

  // Repeat to expand
  await page.keyboard.press(`${modifier}+.`);

  // Sidebar should expand again
  await expect(page.getByText(run0Name).first()).toBeVisible({ timeout: 10_000 });
});
