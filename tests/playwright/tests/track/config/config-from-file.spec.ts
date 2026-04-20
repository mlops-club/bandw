import { test, expect } from '../../../fixtures';

test('config-from-file: displays file-based config values', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;
  const run = sdkData.runs[4];

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/runs/${run.id}/overview`);
  await page.getByRole('tab', { name: 'Overview' }).waitFor();

  // Scroll to Config section (below the fold)
  await page.keyboard.press('End');
  await page.waitForTimeout(1000);

  const configSection = page.getByRole('list').filter({ hasText: 'Config parameters' });
  await configSection.waitFor({ timeout: 10_000 });

  // Verify file-based config values
  await expect(configSection.getByText('model:', { exact: true })).toBeVisible();
  await expect(configSection.getByText('"transformer"')).toBeVisible();
  await expect(configSection.getByText('d_model:')).toBeVisible();
  await expect(configSection.getByText('512')).toBeVisible();
  await expect(configSection.getByText('n_heads:')).toBeVisible();
  await expect(configSection.getByText('dropout:')).toBeVisible();
  await expect(configSection.getByText('vocab_size:')).toBeVisible();
});
