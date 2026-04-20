import { test, expect } from '../../../fixtures';

test('config-at-init: displays config keys set at wandb.init', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;
  const run = sdkData.runs[0];

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/runs/${run.id}/overview`);
  await page.getByRole('tab', { name: 'Overview' }).waitFor();

  // Scope assertions to the Config section to avoid matching metadata/OS strings
  const configSection = page.getByRole('list').filter({ hasText: 'Config parameters' });
  await configSection.waitFor();

  // Verify each config key-value pair
  await expect(configSection.getByText('lr:')).toBeVisible();
  await expect(configSection.getByText('0.01')).toBeVisible();

  await expect(configSection.getByText('epochs:')).toBeVisible();
  await expect(configSection.getByText('10', { exact: true })).toBeVisible();

  await expect(configSection.getByText('arch:')).toBeVisible();
  await expect(configSection.getByText('"resnet18"')).toBeVisible();

  // Nested/array value — may render as list items or comma-separated
  await expect(configSection.getByText('hidden_layers:')).toBeVisible();
  await expect(configSection.getByText('128')).toBeVisible();
  await expect(configSection.getByText(/\b64\b/)).toBeVisible();
});
