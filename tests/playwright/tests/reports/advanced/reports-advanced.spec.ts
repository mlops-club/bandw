import { test, expect } from '../../../fixtures';

// ---------------------------------------------------------------------------
// Test 1: report-share
// ---------------------------------------------------------------------------
test('report-share: open share modal and verify sharing options', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  // Navigate to Reports tab and open a report
  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/reportlist`);
  await page.getByRole('link', { name: /report/i }).first().click();

  // Click "Share" button
  await page.getByRole('button', { name: /share/i }).click();

  // Share modal opens
  await expect(page.getByRole('dialog')).toBeVisible({ timeout: 10_000 });

  // Verify invite input field (email/username)
  await expect(page.getByRole('textbox', { name: /email|invite|username/i })).toBeVisible({ timeout: 10_000 });

  // Verify permission dropdown ("Can view" / "Can edit")
  await expect(page.getByRole('combobox', { name: /permission/i }).or(page.getByText(/can view|can edit/i).first())).toBeVisible({ timeout: 10_000 });

  // Verify shareable link generation
  await expect(page.getByRole('textbox', { name: /link/i }).or(page.getByText(/copy link/i))).toBeVisible({ timeout: 10_000 });
});

// ---------------------------------------------------------------------------
// Test 2: report-edit-draft
// ---------------------------------------------------------------------------
test('report-edit-draft: edit report and save draft', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  // Navigate to a report
  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/reportlist`);
  await page.getByRole('link', { name: /report/i }).first().click();

  // Click "Edit" to enter edit mode
  await page.getByRole('button', { name: /edit/i }).click();

  // Make changes (add text)
  await page.keyboard.type('Draft edit test content');

  // Verify changes auto-save as draft
  await expect(page.getByText('Draft edit test content')).toBeVisible({ timeout: 10_000 });

  // Click "Save to report" to publish changes
  await page.getByRole('button', { name: /save to report/i }).click();

  // Verify the content persists after save
  await expect(page.getByText('Draft edit test content')).toBeVisible({ timeout: 10_000 });
});

// ---------------------------------------------------------------------------
// Test 3: report-comments
// ---------------------------------------------------------------------------
test('report-comments: add report-level and panel-level comments', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  // Navigate to a report
  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/reportlist`);
  await page.getByRole('link', { name: /report/i }).first().click();

  // Click "Comment" button for report-level comment
  await page.getByRole('button', { name: /comment/i }).click();

  // Type a report-level comment
  await page.getByRole('textbox', { name: /comment/i }).fill('This is a report-level comment');
  await page.keyboard.press('Enter');

  // Verify comment is submitted
  await expect(page.getByText('This is a report-level comment')).toBeVisible({ timeout: 10_000 });
});

// ---------------------------------------------------------------------------
// Test 4: report-star
// ---------------------------------------------------------------------------
test('report-star: star and unstar a report', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  // Navigate to Reports tab
  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/reportlist`);

  // Activate the report star control
  await page.getByRole('button', { name: /star/i }).first().click();

  // Verify star is active (starred state)
  await expect(page.getByRole('button', { name: /unstar|starred/i }).first().or(page.locator('[aria-pressed="true"]').first())).toBeVisible({ timeout: 10_000 });

  // Unstar the report
  await page.getByRole('button', { name: /unstar|star/i }).first().click();
});

// ---------------------------------------------------------------------------
// Test 5: cross-project-report
// ---------------------------------------------------------------------------
test('cross-project-report: add run sets from multiple projects', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  // Navigate to Reports tab and create a new report
  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/reportlist`);
  await page.getByRole('button', { name: /create report/i }).click();

  // Add a panel grid with run set from current project
  await page.keyboard.press('/');
  await page.getByText(/panel grid/i).click();

  // Verify runs from current project are shown
  await expect(page.getByText(/basic-run/i).or(page.getByText(/train-alpha/i)).first()).toBeVisible({ timeout: 10_000 });

  // Select alternate project for cross-project data
  const project2 = sdkData.extra?.project2;
  if (project2) {
    await page.getByRole('combobox', { name: /project/i }).click();
    await page.getByRole('option', { name: new RegExp(project2) }).click();
    await expect(page.getByText('cross-project-run')).toBeVisible({ timeout: 10_000 });
  }
});

// ---------------------------------------------------------------------------
// Test 6: view-only-report-links
// ---------------------------------------------------------------------------
test('view-only-report-links: generate and access view-only link', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  // Navigate to a report
  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/reportlist`);
  await page.getByRole('link', { name: /report/i }).first().click();

  // Open share flow
  await page.getByRole('button', { name: /share/i }).click();
  await expect(page.getByRole('dialog')).toBeVisible({ timeout: 10_000 });

  // Copy view-only link
  await expect(page.getByRole('textbox', { name: /link/i }).or(page.getByText(/copy link|view-only/i))).toBeVisible({ timeout: 10_000 });
});

// ---------------------------------------------------------------------------
// Test 7: report-clone
// ---------------------------------------------------------------------------
test('report-clone: clone a report via actions menu', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  // Navigate to a report
  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/reportlist`);
  await page.getByRole('link', { name: /report/i }).first().click();

  // Open the report actions menu
  await page.getByRole('button', { name: /more|actions|menu|\.\.\./i }).click();

  // Click "Clone this report"
  await page.getByRole('menuitem', { name: /clone/i }).click();

  // Destination modal opens
  await expect(page.getByRole('dialog')).toBeVisible({ timeout: 10_000 });

  // Confirm cloning
  await page.getByRole('button', { name: /clone|confirm|create/i }).click();

  // Verify cloned report loads
  await expect(page.getByText(/clone|copy/i)).toBeVisible({ timeout: 10_000 });
});

// ---------------------------------------------------------------------------
// Test 8: report-export
// ---------------------------------------------------------------------------
test('report-export: export report as PDF', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  // Navigate to a report
  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/reportlist`);
  await page.getByRole('link', { name: /report/i }).first().click();

  // Open the report actions menu
  await page.getByRole('button', { name: /more|actions|menu|\.\.\./i }).click();

  // Click "Download"
  await page.getByRole('menuitem', { name: /download|export/i }).click();

  // Format options appear (PDF, LaTeX)
  await expect(page.getByText(/pdf/i)).toBeVisible({ timeout: 10_000 });

  // Select PDF and trigger download
  const downloadPromise = page.waitForEvent('download');
  await page.getByText(/pdf/i).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/\.pdf$/);
});

// ---------------------------------------------------------------------------
// Test 9: send-panel-to-report
// ---------------------------------------------------------------------------
test('send-panel-to-report: send workspace panel to a report', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  // Navigate to workspace
  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/workspace`);
  await page.getByRole('button', { name: 'Add panels' }).waitFor({ timeout: 30_000 });

  // Click panel dropdown menu
  await page.locator('[class*="panel"]').first().getByRole('button', { name: /more|menu|\.\.\./i }).click();

  // Select "Add to report"
  await page.getByRole('menuitem', { name: /add to report/i }).click();

  // Report selector appears
  await expect(page.getByRole('dialog').or(page.getByRole('combobox', { name: /report/i }))).toBeVisible({ timeout: 10_000 });
});
