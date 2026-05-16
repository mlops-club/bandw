import { test, expect } from '../../../fixtures';

test('config-mid-run: displays final config values after mid-run update', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;
  const run = sdkData.runs[1];

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/runs/${run.id}/overview`);
  await page.getByRole('tab', { name: 'Overview' }).waitFor();

  const configSection = page.getByRole('list').filter({ hasText: 'Config parameters' });
  await configSection.waitFor();

  // "lr" was set to 0.01 at init, then updated to 0.001 mid-run
  await expect(configSection.getByText('lr:')).toBeVisible();
  await expect(configSection.getByText('0.001')).toBeVisible();

  // "batch_size" was added mid-run via config.update
  await expect(configSection.getByText('batch_size:')).toBeVisible();
  await expect(configSection.getByText('32')).toBeVisible();
});
