import { test, expect } from '../../../../fixtures';

test('share-panel-embed-options: open panel share or actions menu', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/workspace`);
  await page.getByRole('button', { name: 'Add panels' }).waitFor({ timeout: 30_000 });

  // Hover over a panel and open the actions menu
  await page.getByText(/train\/loss/i).first().hover();
  await page.getByRole('button', { name: 'More panel actions' }).first().click();

  // Verify the share/actions UI is visible
  await expect(page.getByRole('menu')
    .or(page.getByRole('menuitem').first())).toBeVisible({ timeout: 10_000 });
});

test('share-panel-embed-options: embed or social-sharing options are available', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/workspace`);
  await page.getByRole('button', { name: 'Add panels' }).waitFor({ timeout: 30_000 });

  // Open the panel actions menu
  await page.getByText(/train\/loss/i).first().hover();
  await page.getByRole('button', { name: 'More panel actions' }).first().click();

  // Verify embed or sharing options are visible
  await expect(page.getByRole('menuitem', { name: /share|embed|export/i })
    .or(page.getByText(/share|embed|export/i)).first()).toBeVisible({ timeout: 10_000 });
});

test('share-panel-embed-options: email-report option is available', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/workspace`);
  await page.getByRole('button', { name: 'Add panels' }).waitFor({ timeout: 30_000 });

  // Open the panel actions menu
  await page.getByText(/train\/loss/i).first().hover();
  await page.getByRole('button', { name: 'More panel actions' }).first().click();

  // Verify the email-report action is visible
  await expect(page.getByRole('menuitem', { name: /email|report|send/i })
    .or(page.getByText(/email|report|send/i)).first()).toBeVisible({ timeout: 10_000 });
});
