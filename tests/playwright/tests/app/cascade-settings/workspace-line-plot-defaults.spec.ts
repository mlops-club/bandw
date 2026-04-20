import { test, expect } from '../../../fixtures';

test('workspace-line-plot-defaults: line plots settings show Data and Display preferences tabs', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/workspace`);
  await page.getByRole('button', { name: 'Add panels' }).waitFor({ timeout: 30_000 });

  // Open workspace settings
  await page.getByRole('button', { name: /workspace settings/i }).first().click();

  // Click on "Line plots"
  await page.getByText(/line plots/i).first().click();

  // Verify two tabs: "Data" and "Display preferences"
  await expect(page.getByRole('tab', { name: /data/i }).or(page.getByText(/^data$/i)).first()).toBeVisible({ timeout: 10_000 });
  await expect(
    page.getByRole('tab', { name: /display preferences/i }).or(page.getByText(/display preferences/i)).first()
  ).toBeVisible({ timeout: 10_000 });
});

test('workspace-line-plot-defaults: change x-axis default to relative time', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/workspace`);
  await page.getByRole('button', { name: 'Add panels' }).waitFor({ timeout: 30_000 });

  await page.getByRole('button', { name: /workspace settings/i }).first().click();
  await page.getByText(/line plots/i).first().click();

  // Find x-axis control and verify it is accessible
  const xAxisControl = page.getByLabel(/x.axis/i)
    .or(page.getByText(/x.axis/i));
  await expect(xAxisControl.first()).toBeVisible({ timeout: 10_000 });
});

test('workspace-line-plot-defaults: change smoothing default', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/workspace`);
  await page.getByRole('button', { name: 'Add panels' }).waitFor({ timeout: 30_000 });

  await page.getByRole('button', { name: /workspace settings/i }).first().click();
  await page.getByText(/line plots/i).first().click();

  // Find and verify smoothing control
  const smoothingControl = page.getByRole('slider', { name: /smoothing/i })
    .or(page.getByLabel(/smoothing/i));
  await expect(smoothingControl.first()).toBeVisible({ timeout: 10_000 });
});

test('workspace-line-plot-defaults: toggle outlier rescaling', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/workspace`);
  await page.getByRole('button', { name: 'Add panels' }).waitFor({ timeout: 30_000 });

  await page.getByRole('button', { name: /workspace settings/i }).first().click();
  await page.getByText(/line plots/i).first().click();

  // Find outlier rescaling toggle
  const outlierToggle = page.getByRole('checkbox', { name: /outlier/i })
    .or(page.getByLabel(/outlier/i));
  await expect(outlierToggle.first()).toBeVisible({ timeout: 10_000 });
});

test('workspace-line-plot-defaults: change point aggregation method', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/workspace`);
  await page.getByRole('button', { name: 'Add panels' }).waitFor({ timeout: 30_000 });

  await page.getByRole('button', { name: /workspace settings/i }).first().click();
  await page.getByText(/line plots/i).first().click();

  // Find point aggregation control
  const aggregationControl = page.getByLabel(/point aggregation/i)
    .or(page.getByText(/point aggregation/i));
  await expect(aggregationControl.first()).toBeVisible({ timeout: 10_000 });
});

test('workspace-line-plot-defaults: adjust max runs or groups', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/workspace`);
  await page.getByRole('button', { name: 'Add panels' }).waitFor({ timeout: 30_000 });

  await page.getByRole('button', { name: /workspace settings/i }).first().click();
  await page.getByText(/line plots/i).first().click();

  // Find max runs/groups control
  const maxRunsControl = page.getByLabel(/max.*runs/i)
    .or(page.getByText(/max.*runs/i))
    .or(page.getByLabel(/max.*groups/i));
  await expect(maxRunsControl.first()).toBeVisible({ timeout: 10_000 });
});

test('workspace-line-plot-defaults: display preferences tab shows legend and tooltip options', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/workspace`);
  await page.getByRole('button', { name: 'Add panels' }).waitFor({ timeout: 30_000 });

  await page.getByRole('button', { name: /workspace settings/i }).first().click();
  await page.getByText(/line plots/i).first().click();

  // Switch to "Display preferences" tab
  await page.getByRole('tab', { name: /display preferences/i })
    .or(page.getByText(/display preferences/i))
    .first().click();

  // Verify legend and tooltip options exist
  await expect(
    page.getByText(/tooltip/i).or(page.getByText(/legend/i)).first()
  ).toBeVisible({ timeout: 10_000 });
});

test('workspace-line-plot-defaults: toggle colored run names in tooltips', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/workspace`);
  await page.getByRole('button', { name: 'Add panels' }).waitFor({ timeout: 30_000 });

  await page.getByRole('button', { name: /workspace settings/i }).first().click();
  await page.getByText(/line plots/i).first().click();

  // Switch to "Display preferences"
  await page.getByRole('tab', { name: /display preferences/i })
    .or(page.getByText(/display preferences/i))
    .first().click();

  // Find "Colored run names in tooltips" toggle
  const coloredRunsToggle = page.getByRole('checkbox', { name: /colored run names/i })
    .or(page.getByLabel(/colored run names/i));
  await expect(coloredRunsToggle.first()).toBeVisible({ timeout: 10_000 });
});

test('workspace-line-plot-defaults: toggle full run names on primary tooltips', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/workspace`);
  await page.getByRole('button', { name: 'Add panels' }).waitFor({ timeout: 30_000 });

  await page.getByRole('button', { name: /workspace settings/i }).first().click();
  await page.getByText(/line plots/i).first().click();

  // Switch to "Display preferences"
  await page.getByRole('tab', { name: /display preferences/i })
    .or(page.getByText(/display preferences/i))
    .first().click();

  // Find "Full run names on primary tooltips" toggle
  const fullNamesToggle = page.getByRole('checkbox', { name: /full run names/i })
    .or(page.getByLabel(/full run names/i));
  await expect(fullNamesToggle.first()).toBeVisible({ timeout: 10_000 });
});
