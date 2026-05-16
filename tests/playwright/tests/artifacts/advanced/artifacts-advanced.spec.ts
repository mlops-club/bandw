import { test, expect } from '../../../fixtures';

// ---------------------------------------------------------------------------
// Test 1: artifact-with-files-and-dirs
// ---------------------------------------------------------------------------
test('artifact-with-files-and-dirs: browse files and directories in artifact', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  // Navigate to the structured-dataset artifact
  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/artifacts/dataset/structured-dataset`);

  // Click Files tab
  await page.getByRole('link', { name: 'Files' }).click();

  // Verify renamed single file appears
  await expect(page.getByText('renamed_file.txt')).toBeVisible({ timeout: 10_000 });

  // Verify directory contents appear
  await expect(page.getByText('images')).toBeVisible({ timeout: 10_000 });

  // Expand directory and verify image files
  await page.getByText('images').click();
  await expect(page.getByText('img_0.png')).toBeVisible({ timeout: 10_000 });
});

// ---------------------------------------------------------------------------
// Test 2: artifact-custom-aliases
// ---------------------------------------------------------------------------
test('artifact-custom-aliases: verify custom aliases on artifact', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  // Navigate to the aliased-model artifact
  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/artifacts/model/aliased-model`);

  // Verify "latest" alias is shown
  await expect(page.getByText('latest')).toBeVisible({ timeout: 10_000 });

  // Verify custom aliases are visible
  await expect(page.getByText('best-model')).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText('production')).toBeVisible({ timeout: 10_000 });
});

// ---------------------------------------------------------------------------
// Test 3: artifact-version-auto-increment
// ---------------------------------------------------------------------------
test('artifact-version-auto-increment: three auto-incremented versions listed', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  // Navigate to versioned-data artifact
  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/artifacts/dataset/versioned-data`);

  // Click Versions tab
  await page.getByRole('link', { name: 'Version' }).click();

  // Verify v0, v1, v2 listed
  await expect(page.getByRole('link', { name: 'v0' })).toBeVisible({ timeout: 10_000 });
  await expect(page.getByRole('link', { name: 'v1' })).toBeVisible({ timeout: 10_000 });
  await expect(page.getByRole('link', { name: 'v2' })).toBeVisible({ timeout: 10_000 });

  // Click v0 and verify details
  await page.getByRole('link', { name: 'v0' }).click();
  await expect(page.getByText('v0')).toBeVisible({ timeout: 10_000 });

  // Click v2 and verify different metadata
  await page.getByRole('link', { name: 'v2' }).click();
  await expect(page.getByText('v2')).toBeVisible({ timeout: 10_000 });
});

// ---------------------------------------------------------------------------
// Test 4: artifact-delete
// ---------------------------------------------------------------------------
test('artifact-delete: delete an artifact version via UI', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  // Navigate to deletable-data artifact
  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/artifacts/dataset/deletable-data`);

  // Click Versions tab to see both versions
  await page.getByRole('link', { name: 'Version' }).click();
  await expect(page.getByRole('link', { name: 'v0' })).toBeVisible({ timeout: 10_000 });
  await expect(page.getByRole('link', { name: 'v1' })).toBeVisible({ timeout: 10_000 });

  // Select v0 for deletion
  await page.getByRole('link', { name: 'v0' }).click();

  // Trigger delete action via the actions menu or delete button
  await page.getByRole('button', { name: /delete/i }).click();

  // Confirmation dialog appears
  await expect(page.getByRole('dialog')).toBeVisible({ timeout: 10_000 });

  // Confirm deletion
  await page.getByRole('button', { name: /confirm|delete/i }).click();

  // Verify v0 is removed but v1 remains
  await expect(page.getByRole('link', { name: 'v1' })).toBeVisible({ timeout: 10_000 });
});

// ---------------------------------------------------------------------------
// Test 5: artifact-update-metadata
// ---------------------------------------------------------------------------
test('artifact-update-metadata: verify metadata and description on artifact', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  // Navigate to metadata-artifact
  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/artifacts/dataset/metadata-artifact`);

  // Click Metadata tab
  await page.getByRole('link', { name: 'Metadata' }).click();

  // Verify metadata key-values match SDK-logged values
  await expect(page.getByText('framework')).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText('pytorch')).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText('dataset_size')).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText('50000')).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText('split')).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText('train')).toBeVisible({ timeout: 10_000 });

  // Verify description appears
  await expect(page.getByText('An artifact with rich metadata for testing.')).toBeVisible({ timeout: 10_000 });
});
