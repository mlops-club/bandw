import { test, expect } from '../../../../fixtures';

test('share-panel-url: copy panel URL from actions menu', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/workspace`);
  await page.getByRole('button', { name: 'Add panels' }).waitFor({ timeout: 30_000 });

  // Hover over a panel and open the actions menu
  await page.getByText(/train\/loss/i).first().hover();
  await page.getByRole('button', { name: 'More panel actions' }).first().click();

  // Click copy panel URL
  await page.getByRole('menuitem', { name: /copy panel url/i })
    .or(page.getByText(/copy panel url/i)).first().click();

  // Verify a success toast or confirmation appears
  await expect(page.getByText(/copied/i)
    .or(page.getByRole('alert')).first()).toBeVisible({ timeout: 10_000 });
});

test('share-panel-url: copied URL contains panel-identifying query parameters', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  // Grant clipboard permissions
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/workspace`);
  await page.getByRole('button', { name: 'Add panels' }).waitFor({ timeout: 30_000 });

  // Copy panel URL
  await page.getByText(/train\/loss/i).first().hover();
  await page.getByRole('button', { name: 'More panel actions' }).first().click();
  await page.getByRole('menuitem', { name: /copy panel url/i })
    .or(page.getByText(/copy panel url/i)).first().click();

  // Read clipboard content and verify it contains panel-identifying parameters
  const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
  expect(clipboardText).toContain(sdkData.project);
  expect(clipboardText).toMatch(/fullScreen|panelId|panel/i);
});

test('share-panel-url: navigate to copied URL opens full-screen panel', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/workspace`);
  await page.getByRole('button', { name: 'Add panels' }).waitFor({ timeout: 30_000 });

  // Copy panel URL
  await page.getByText(/train\/loss/i).first().hover();
  await page.getByRole('button', { name: 'More panel actions' }).first().click();
  await page.getByRole('menuitem', { name: /copy panel url/i })
    .or(page.getByText(/copy panel url/i)).first().click();

  // Read clipboard and navigate to the URL
  const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
  await page.goto(clipboardText);

  // Verify the panel opens in full-screen mode
  await expect(page.getByText(/train\/loss/i).first()).toBeVisible({ timeout: 10_000 });
});

test('share-panel-url: back navigation returns to workspace from full-screen', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/workspace`);
  await page.getByRole('button', { name: 'Add panels' }).waitFor({ timeout: 30_000 });

  // Open full-screen via button
  await page.getByText(/train\/loss/i).first().hover();
  await page.getByRole('button', { name: 'View full screen' }).first().click();

  // Use the back/left arrow to return
  const backButton = page.getByRole('button', { name: /back/i })
    .or(page.getByLabel(/back/i))
    .or(page.getByRole('button', { name: /left/i }));
  await backButton.first().click();

  // Verify we returned to the workspace with multiple panels
  await expect(page.getByText(/train\/acc/i).first()).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText(/val\/loss/i).first()).toBeVisible({ timeout: 10_000 });
});
