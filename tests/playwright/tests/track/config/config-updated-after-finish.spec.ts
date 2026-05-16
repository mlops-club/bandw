import { test, expect } from '../../../fixtures';

test('config-post-finish: displays config keys updated after run completion', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;
  const run = sdkData.runs[3];

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/runs/${run.id}/overview`);
  await page.getByRole('tab', { name: 'Overview' }).waitFor();

  const configSection = page.getByRole('list').filter({ hasText: 'Config parameters' });
  await configSection.waitFor();

  // "lr" was set to 0.01 at init, then updated to 0.005 via Public API post-finish
  await expect(configSection.getByText('lr:')).toBeVisible();
  await expect(configSection.getByText('0.005')).toBeVisible();

  // "batch_size" was added via Public API after the run finished
  await expect(configSection.getByText('batch_size:')).toBeVisible();
  await expect(configSection.getByText('64', { exact: true })).toBeVisible();
});
