import { test, expect } from '../../../fixtures';

test('overview-editable: notes field is visible', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;
  const run = sdkData.runs[0];

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/runs/${run.id}/overview`);
  await page.getByRole('tab', { name: 'Overview' }).waitFor({ timeout: 30_000 });

  // Both UIs have a notes/description area on the overview page
  // wandb.ai shows "Notes" label, bandw shows "NOTES" (h2 with text-transform)
  // Just verify some notes-related text exists
  await expect(page.getByText(/notes/i).first()).toBeVisible({ timeout: 10_000 });
});

test('overview-editable: tags are visible and can be managed', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;
  const run = sdkData.runs[0];

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/runs/${run.id}/overview`);
  await page.getByRole('tab', { name: 'Overview' }).waitFor({ timeout: 30_000 });

  // Verify existing tags are visible
  await expect(page.getByText('test-tag-1', { exact: true })).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText('test-tag-2', { exact: true })).toBeVisible({ timeout: 10_000 });

  // Verify the "+" button to add tags is present
  await expect(
    page.getByRole('button', { name: '+' })
      .or(page.getByText('+', { exact: true }).first())
  ).toBeVisible({ timeout: 10_000 });
});
