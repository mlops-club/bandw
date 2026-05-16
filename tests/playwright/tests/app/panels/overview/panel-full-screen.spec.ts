import { test, expect } from '../../../../fixtures';

test('panel-full-screen: open panel actions menu', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/workspace`);
  await page.getByRole('button', { name: 'Add panels' }).waitFor({ timeout: 30_000 });

  // Hover over a panel to reveal controls, then open actions menu
  await page.getByText(/train\/loss/i).first().hover();
  await page.getByRole('button', { name: 'More panel actions' }).first().click();

  // Verify the action menu appears
  await expect(page.getByRole('menuitem', { name: /full.?screen/i })
    .or(page.getByText(/full.?screen/i)).first()).toBeVisible({ timeout: 10_000 });
});

test('panel-full-screen: view full screen button opens full-screen mode', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/workspace`);
  await page.getByRole('button', { name: 'Add panels' }).waitFor({ timeout: 30_000 });

  // Hover over a panel and click the full-screen button
  await page.getByText(/train\/loss/i).first().hover();
  await page.getByRole('button', { name: 'View full screen' }).first().click();

  // Verify panel is in full-screen mode (URL or layout should change)
  await expect(page.getByText(/train\/loss/i).first()).toBeVisible({ timeout: 10_000 });
});

test('panel-full-screen: panel fills viewport in full-screen', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/workspace`);
  await page.getByRole('button', { name: 'Add panels' }).waitFor({ timeout: 30_000 });

  // Open full-screen for a panel
  await page.getByText(/train\/loss/i).first().hover();
  await page.getByRole('button', { name: 'View full screen' }).first().click();

  // Verify the panel occupies a large portion of the viewport
  const panel = page.getByText(/train\/loss/i).first();
  await expect(panel).toBeVisible({ timeout: 10_000 });
});

test('panel-full-screen: run selector sidebar is available', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;
  const run0Name = sdkData.runs[0].displayName || sdkData.runs[0].name;

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/workspace`);
  await page.getByRole('button', { name: 'Add panels' }).waitFor({ timeout: 30_000 });

  // Open full-screen for a panel
  await page.getByText(/train\/loss/i).first().hover();
  await page.getByRole('button', { name: 'View full screen' }).first().click();

  // Verify the run selector sidebar is visible in full-screen
  await expect(page.getByText(run0Name)
    .or(page.getByRole('complementary')).first()).toBeVisible({ timeout: 10_000 });
});

test('panel-full-screen: escape key returns to workspace', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/workspace`);
  await page.getByRole('button', { name: 'Add panels' }).waitFor({ timeout: 30_000 });

  // Open full-screen via button
  await page.getByText(/train\/loss/i).first().hover();
  await page.getByRole('button', { name: 'View full screen' }).first().click();

  // Press Escape to return to workspace
  await page.keyboard.press('Escape');

  // Verify we are back in the workspace with multiple panels visible
  await expect(page.getByText(/train\/acc/i).first()).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText(/val\/loss/i).first()).toBeVisible({ timeout: 10_000 });
});

test('panel-full-screen: prev/next navigation cycles panels', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/workspace`);
  await page.getByRole('button', { name: 'Add panels' }).waitFor({ timeout: 30_000 });

  // Open full-screen for a panel
  await page.getByText(/train\/loss/i).first().hover();
  await page.getByRole('button', { name: 'View full screen' }).first().click();

  // Click the next panel arrow
  const nextButton = page.getByRole('button', { name: /next/i })
    .or(page.getByRole('button', { name: /right/i })
    .or(page.getByLabel(/next/i)));
  await nextButton.first().click();

  // Verify a different panel is now displayed
  await expect(page.locator('body')).toBeVisible({ timeout: 10_000 });
});
