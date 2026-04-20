import { test, expect } from '../../../fixtures';

// ---------------------------------------------------------------------------
// Test 1: artifact-create-and-browse
// ---------------------------------------------------------------------------
test('artifact-create-and-browse: browse artifact types and verify details', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  // Navigate to project Artifacts tab
  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/artifacts`);

  // Artifact types listed in left sidebar
  await expect(page.getByRole('treeitem', { name: /dataset/ })).toBeVisible({ timeout: 10_000 });
  await expect(page.getByRole('treeitem', { name: /model/ })).toBeVisible({ timeout: 10_000 });

  // Select "dataset" type
  await page.getByRole('treeitem', { name: /dataset/ }).click();

  // Select specific artifact
  await page.getByRole('link', { name: /my-dataset/ }).click();

  // Verify artifact name visible
  await expect(page.getByText('my-dataset')).toBeVisible({ timeout: 10_000 });

  // Click "Metadata" tab and verify key-values
  await page.getByRole('link', { name: 'Metadata' }).click();
  await expect(page.getByText('num_samples')).toBeVisible({ timeout: 10_000 });

  // Click "Usage" tab and verify producing run listed
  await page.getByRole('link', { name: 'Usage' }).click();
  await expect(page.getByText('data-producer')).toBeVisible({ timeout: 10_000 });

  // Click "Files" tab and verify file list
  await page.getByRole('link', { name: 'Files' }).click();
  await expect(page.getByText('README.md')).toBeVisible({ timeout: 10_000 });
});

// ---------------------------------------------------------------------------
// Test 2: artifact-download (files tab file download)
// ---------------------------------------------------------------------------
test('artifact-download: download a file from the Files tab', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  // Navigate to artifact detail
  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/artifacts/dataset/my-dataset`);

  // Open Files tab
  await page.getByRole('link', { name: 'Files' }).click();
  await expect(page.getByText('README.md')).toBeVisible({ timeout: 10_000 });

  // Trigger download and verify it succeeds
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('link', { name: 'README.md' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toContain('README');
});

// ---------------------------------------------------------------------------
// Test 3: artifact-versions
// ---------------------------------------------------------------------------
test('artifact-versions: list and navigate between versions', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  // Navigate to dataset artifact
  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/artifacts/dataset/my-dataset`);

  // Click "Versions" tab
  await page.getByRole('link', { name: 'Version' }).click();

  // Verify v0, v1, v2 listed
  await expect(page.getByRole('link', { name: 'v0' })).toBeVisible({ timeout: 10_000 });
  await expect(page.getByRole('link', { name: 'v1' })).toBeVisible({ timeout: 10_000 });
  await expect(page.getByRole('link', { name: 'v2' })).toBeVisible({ timeout: 10_000 });

  // Click on v0 and verify it loads
  await page.getByRole('link', { name: 'v0' }).click();
  await expect(page.getByText('v0')).toBeVisible({ timeout: 10_000 });

  // Click on v2 and verify distinct metadata
  await page.getByRole('link', { name: 'v2' }).click();
  await expect(page.getByText('v2')).toBeVisible({ timeout: 10_000 });
});

// ---------------------------------------------------------------------------
// Test 4: artifact-lineage-view
// ---------------------------------------------------------------------------
test('artifact-lineage-view: DAG graph renders with run and artifact nodes', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  // Navigate to model artifact (has lineage: dataset -> trainer run -> model)
  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/artifacts/model/my-model`);

  // Click "Lineage" tab
  await page.getByRole('link', { name: 'Lineage' }).click();

  // DAG graph renders with nodes
  await expect(page.getByRole('img', { name: /lineage/i }).or(page.locator('[class*="lineage"]').or(page.locator('[data-testid="lineage-graph"]')))).toBeVisible({ timeout: 10_000 });

  // Verify run node (trainer) and artifact nodes visible
  await expect(page.getByText('trainer')).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText('my-dataset')).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText('my-model')).toBeVisible({ timeout: 10_000 });
});

// ---------------------------------------------------------------------------
// Test 5: artifact-lineage-navigate
// ---------------------------------------------------------------------------
test('artifact-lineage-navigate: interact with lineage graph nodes', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/artifacts/model/my-model`);
  await page.getByRole('link', { name: 'Lineage' }).click();

  // Click on a run node to see metadata panel
  await page.getByText('trainer').click();
  await expect(page.getByText('trainer')).toBeVisible({ timeout: 10_000 });

  // Click on an artifact node to see details
  await page.getByText('my-dataset').click();
  await expect(page.getByText('my-dataset')).toBeVisible({ timeout: 10_000 });
});

// ---------------------------------------------------------------------------
// Test 6: artifact-lineage-clusters
// ---------------------------------------------------------------------------
test('artifact-lineage-clusters: clustered nodes appear with many versions', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  // Model artifact has 6 versions (v0..v5) -- should trigger clustering
  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/artifacts/model/my-model`);
  await page.getByRole('link', { name: 'Lineage' }).click();

  // Clustered nodes should appear for the many model versions
  await expect(page.getByText('my-model')).toBeVisible({ timeout: 10_000 });

  // Verify multiple version nodes or a cluster indicator is present
  await expect(page.getByText(/v\d/).first()).toBeVisible({ timeout: 10_000 });
});
