import { test, expect } from '../../../fixtures';

test('config-argparse: displays argparse-provided config values', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;
  const run = sdkData.runs[2];

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/runs/${run.id}/overview`);
  await page.getByRole('tab', { name: 'Overview' }).waitFor();

  const configSection = page.getByRole('list').filter({ hasText: 'Config parameters' });
  await configSection.waitFor();

  // Verify argparse config values: lr=0.001, epochs=20, optimizer="adam"
  await expect(configSection.getByText('lr:')).toBeVisible();
  await expect(configSection.getByText('0.001')).toBeVisible();

  await expect(configSection.getByText('epochs:')).toBeVisible();
  await expect(configSection.getByText('20')).toBeVisible();

  await expect(configSection.getByText('optimizer:')).toBeVisible();
  await expect(configSection.getByText('adam')).toBeVisible();
});
