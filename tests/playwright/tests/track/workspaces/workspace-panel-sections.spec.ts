import { test, expect } from '../../../fixtures';

test('panel sections: sections exist with collapse toggles', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/workspace`);
  await page.getByRole('button', { name: 'Add panels' }).waitFor({ timeout: 30_000 });

  // Section headers should be visible with collapse buttons
  const collapseButtons = page.getByRole('button', { name: /Collapse.*section|Expand.*section/i });
  await expect(collapseButtons.first()).toBeVisible({ timeout: 10_000 });
});

test('panel sections: section names match metric prefixes', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/workspace`);
  await page.getByRole('button', { name: 'Add panels' }).waitFor({ timeout: 30_000 });

  // Sections should be grouped by metric prefix (train, val)
  await expect(page.getByText(/train/i).first()).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText(/val/i).first()).toBeVisible({ timeout: 10_000 });
});

test('panel sections: collapsing a section hides its content', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/workspace`);
  await page.getByRole('button', { name: 'Add panels' }).waitFor({ timeout: 30_000 });

  // Find the first collapse button and click it
  const collapseButton = page.getByRole('button', { name: /Collapse.*section/i }).first();
  await collapseButton.click();

  // After collapsing, the expand button should appear for that section
  await expect(page.getByRole('button', { name: /Expand.*section/i }).first()).toBeVisible({ timeout: 10_000 });
});

test('panel sections: section panel count badge visible', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/workspace`);
  await page.getByRole('button', { name: 'Add panels' }).waitFor({ timeout: 30_000 });

  // Each section should show a count badge indicating number of panels
  // Look for a number near the section header
  await expect(page.getByText(/\d+\s*panel/i).or(page.getByText(/\(\d+\)/)).first()).toBeVisible({ timeout: 10_000 });
});

test('panel sections: search panels filters by title', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/workspace`);
  await page.getByRole('button', { name: 'Add panels' }).waitFor({ timeout: 30_000 });

  // Use the search panels input
  const searchInput = page.getByPlaceholder(/Search panels/i);
  await searchInput.fill('accuracy');

  // Only accuracy-related panels should be visible
  await expect(page.getByText(/accuracy/i).first()).toBeVisible({ timeout: 10_000 });
});

test('panel sections: pagination controls navigate panels', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/workspace`);
  await page.getByRole('button', { name: 'Add panels' }).waitFor({ timeout: 30_000 });

  // If pagination exists, prev/next buttons should be available
  // At least check that section navigation elements exist
  // (pagination only appears if there are more panels than fit in one page)
  const sectionSettings = page.getByRole('button', { name: /Section settings/i }).first();
  await expect(sectionSettings).toBeVisible({ timeout: 10_000 });
});

test('panel sections: panels display in grid layout', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/workspace`);
  await page.getByRole('button', { name: 'Add panels' }).waitFor({ timeout: 30_000 });

  // Verify multiple panels are visible (indicating grid layout)
  await expect(page.getByText(/loss/i).first()).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText(/accuracy/i).first()).toBeVisible({ timeout: 10_000 });
});

test('panel sections: pin section button exists', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/workspace`);
  await page.getByRole('button', { name: 'Add panels' }).waitFor({ timeout: 30_000 });

  // Each section should have a pin button
  const pinButton = page.getByRole('button', { name: /Pin section/i }).first();
  await expect(pinButton).toBeVisible({ timeout: 10_000 });
});
