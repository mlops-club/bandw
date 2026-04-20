import { test, expect } from '../../../fixtures';

test('overview-config: displays config keys and values', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;
  const run = sdkData.runs[0]; // "basic-run"

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/runs/${run.id}/overview`);
  await page.getByRole('tab', { name: 'Overview' }).waitFor({ timeout: 30_000 });

  // Scroll to Config section (below the fold)
  await page.keyboard.press('End');
  await page.waitForTimeout(1000);

  const configSection = page.getByRole('list').filter({ hasText: 'Config parameters' });
  await expect(configSection).toBeVisible({ timeout: 10_000 });

  // Verify config keys and values
  await expect(configSection.getByText('lr')).toBeVisible({ timeout: 10_000 });
  await expect(configSection.getByText('0.01').first()).toBeVisible({ timeout: 10_000 });

  await expect(configSection.getByText('epochs')).toBeVisible({ timeout: 10_000 });
  await expect(configSection.getByText('10', { exact: true }).first()).toBeVisible({ timeout: 10_000 });

  await expect(configSection.getByText('arch')).toBeVisible({ timeout: 10_000 });
  await expect(configSection.getByText('resnet18')).toBeVisible({ timeout: 10_000 });
});

test('overview-config: search filters config keys', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;
  const run = sdkData.runs[0]; // "basic-run"

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/runs/${run.id}/overview`);
  await page.getByRole('tab', { name: 'Overview' }).waitFor({ timeout: 30_000 });

  // Scroll to Config section (below the fold)
  await page.keyboard.press('End');
  await page.waitForTimeout(1000);

  const configSection = page.getByRole('list').filter({ hasText: 'Config parameters' });
  await expect(configSection).toBeVisible({ timeout: 10_000 });

  // Find the config search textbox and type "lr"
  const searchBox = page.getByPlaceholder('search keys with regex');
  await searchBox.first().fill('lr');

  // "lr" key should still be visible
  await expect(configSection.getByText('lr')).toBeVisible({ timeout: 10_000 });

  // Clear search
  await searchBox.first().clear();

  // All config keys should be visible again
  await expect(configSection.getByText('epochs')).toBeVisible({ timeout: 10_000 });
  await expect(configSection.getByText('arch')).toBeVisible({ timeout: 10_000 });
});
