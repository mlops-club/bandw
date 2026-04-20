import { test, expect } from '../../../fixtures';

test('tab-navigation: all tabs are present and clickable', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;
  const run = sdkData.runs[0]; // "basic-run"

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/runs/${run.id}`);

  // Wait for the page to load by checking for a known tab
  await page.getByRole('tab', { name: 'Overview' }).waitFor({ timeout: 30_000 });

  // Verify core expected tabs are present
  const coreTabNames = ['Charts', 'Overview', 'Logs', 'Files'];
  for (const tabName of coreTabNames) {
    await expect(page.getByRole('tab', { name: tabName })).toBeVisible({ timeout: 10_000 });
  }
});

test('tab-navigation: clicking each tab switches content', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;
  const run = sdkData.runs[0]; // "basic-run"

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/runs/${run.id}`);

  // Wait for the page to load
  await page.getByRole('tab', { name: 'Overview' }).waitFor({ timeout: 30_000 });

  // Click core tabs that are always present and verify content loads
  const coreTabNames = ['Charts', 'Overview', 'Logs', 'Files'];

  for (const tabName of coreTabNames) {
    const tab = page.getByRole('tab', { name: tabName });
    await tab.click();

    // Wait for tab content to load
    await page.waitForTimeout(1000);

    // Verify the tab is now selected (aria-selected)
    await expect(tab).toHaveAttribute('aria-selected', 'true', { timeout: 10_000 });
  }
});

test('tab-navigation: run heading and back navigation', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;
  const run = sdkData.runs[0]; // "basic-run"

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/runs/${run.id}`);

  // Wait for the page to load
  await page.getByRole('tab', { name: 'Overview' }).waitFor({ timeout: 30_000 });

  // Verify the project name link is present for back navigation
  await expect(page.locator(`text=${sdkData.project}`).first()).toBeVisible({ timeout: 10_000 });
});
