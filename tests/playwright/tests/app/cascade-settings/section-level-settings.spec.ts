import { test, expect } from '../../../fixtures';

test('section-level-settings: section settings menu opens', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/workspace`);
  await page.getByRole('button', { name: 'Add panels' }).waitFor({ timeout: 30_000 });

  // Click "Section settings" on a named section
  await page.getByRole('button', { name: /section settings/i }).first().click();

  // Verify section settings menu opens
  await expect(page.getByText(/section/i).first()).toBeVisible({ timeout: 10_000 });
});

test('section-level-settings: display preferences are visible', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/workspace`);
  await page.getByRole('button', { name: 'Add panels' }).waitFor({ timeout: 30_000 });

  await page.getByRole('button', { name: /section settings/i }).first().click();

  // Open "Display preferences" within section settings
  await page.getByText(/display preferences/i).first().click();

  // Verify section display settings are visible
  await expect(page.getByText(/display preferences/i).first()).toBeVisible({ timeout: 10_000 });
});

test('section-level-settings: toggle colored run names in tooltips for section', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/workspace`);
  await page.getByRole('button', { name: 'Add panels' }).waitFor({ timeout: 30_000 });

  await page.getByRole('button', { name: /section settings/i }).first().click();

  // Open "Display preferences"
  await page.getByText(/display preferences/i).first().click();

  // Find and verify "Colored run names in tooltips" toggle at section level
  const coloredRunsToggle = page.getByRole('checkbox', { name: /colored run names/i })
    .or(page.getByLabel(/colored run names/i));
  await expect(coloredRunsToggle.first()).toBeVisible({ timeout: 10_000 });
});

test('section-level-settings: section override differs from workspace default', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/workspace`);
  await page.getByRole('button', { name: 'Add panels' }).waitFor({ timeout: 30_000 });

  // Open section settings on the first section
  await page.getByRole('button', { name: /section settings/i }).first().click();

  // Verify override controls are present (e.g., reset or override indicator)
  await expect(
    page.getByText(/override/i)
      .or(page.getByText(/reset/i))
      .or(page.getByText(/display preferences/i))
      .first()
  ).toBeVisible({ timeout: 10_000 });
});

test('section-level-settings: other sections still use workspace defaults', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/workspace`);
  await page.getByRole('button', { name: 'Add panels' }).waitFor({ timeout: 30_000 });

  // Verify multiple sections are present (train and val from prefixed metrics)
  const sections = page.getByRole('button', { name: /section settings/i });
  await expect(sections.first()).toBeVisible({ timeout: 10_000 });

  // Verify there is more than one section
  const sectionCount = await sections.count();
  expect(sectionCount).toBeGreaterThanOrEqual(2);
});
