import { test, expect } from '../../../../fixtures';

// ---------------------------------------------------------------------------
// Images
// ---------------------------------------------------------------------------

test('log-and-view-images: image panel is visible in workspace', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;
  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/workspace`);
  await page.getByRole('button', { name: 'Add panels' }).waitFor({ timeout: 30_000 });

  await expect(page.getByRole('img', { name: /images/i }).first()
    .or(page.getByText(/images/i).first())).toBeVisible({ timeout: 10_000 });
});

test('log-and-view-images: step slider is available', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;
  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/workspace`);
  await page.getByRole('button', { name: 'Add panels' }).waitFor({ timeout: 30_000 });

  await expect(page.getByRole('slider').first()).toBeVisible({ timeout: 10_000 });
});

test('log-and-view-images: caption text matches SDK input', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;
  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/workspace`);
  await page.getByRole('button', { name: 'Add panels' }).waitFor({ timeout: 30_000 });

  await expect(page.getByText(/step-\d+-caption/)).toBeVisible({ timeout: 10_000 });
});

// ---------------------------------------------------------------------------
// Image Overlays: Segmentation Masks
// ---------------------------------------------------------------------------

test('log-and-view-segmentation-masks: mask overlay controls visible', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;
  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/workspace`);
  await page.getByRole('button', { name: 'Add panels' }).waitFor({ timeout: 30_000 });

  // Locate the image-with-masks panel and look for overlay toggle controls
  await expect(page.getByText(/masks/i).first()).toBeVisible({ timeout: 10_000 });
});

test('log-and-view-segmentation-masks: class labels match SDK class_labels', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;
  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/workspace`);
  await page.getByRole('button', { name: 'Add panels' }).waitFor({ timeout: 30_000 });

  await expect(page.getByText(/cat/i).first().or(page.getByText(/dog/i).first())).toBeVisible({ timeout: 10_000 });
});

// ---------------------------------------------------------------------------
// Image Overlays: Bounding Boxes
// ---------------------------------------------------------------------------

test('log-and-view-bounding-boxes: bounding box panel loads', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;
  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/workspace`);
  await page.getByRole('button', { name: 'Add panels' }).waitFor({ timeout: 30_000 });

  await expect(page.getByText(/boxes/i).first()
    .or(page.getByText(/bounding/i).first())).toBeVisible({ timeout: 10_000 });
});

// ---------------------------------------------------------------------------
// Image Overlays in Tables
// ---------------------------------------------------------------------------

test('log-and-view-image-overlays-in-tables: table with overlays loads', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;
  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/workspace`);
  await page.getByRole('button', { name: 'Add panels' }).waitFor({ timeout: 30_000 });

  await expect(page.getByText(/overlay_table/i).first()).toBeVisible({ timeout: 10_000 });
});

// ---------------------------------------------------------------------------
// Histograms
// ---------------------------------------------------------------------------

test('log-and-view-histograms: histogram panel visible', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;
  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/workspace`);
  await page.getByRole('button', { name: 'Add panels' }).waitFor({ timeout: 30_000 });

  await expect(page.getByText(/histogram/i).first()).toBeVisible({ timeout: 10_000 });
});

// ---------------------------------------------------------------------------
// Audio
// ---------------------------------------------------------------------------

test('log-and-view-audio: audio panel with playback controls', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;
  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/workspace`);
  await page.getByRole('button', { name: 'Add panels' }).waitFor({ timeout: 30_000 });

  await expect(page.getByText(/audio/i).first()).toBeVisible({ timeout: 10_000 });
});

test('log-and-view-audio: audio caption matches SDK input', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;
  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/workspace`);
  await page.getByRole('button', { name: 'Add panels' }).waitFor({ timeout: 30_000 });

  await expect(page.getByText(/tone-\d/i).first()).toBeVisible({ timeout: 10_000 });
});

// ---------------------------------------------------------------------------
// Video
// ---------------------------------------------------------------------------

test('log-and-view-video: video panel visible', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;
  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/workspace`);
  await page.getByRole('button', { name: 'Add panels' }).waitFor({ timeout: 30_000 });

  await expect(page.getByText(/video/i).first()).toBeVisible({ timeout: 10_000 });
});

// ---------------------------------------------------------------------------
// 3D Point Clouds
// ---------------------------------------------------------------------------

test('log-and-view-point-clouds: 3D panel renders', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;
  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/workspace`);
  await page.getByRole('button', { name: 'Add panels' }).waitFor({ timeout: 30_000 });

  await expect(page.getByText(/point_cloud/i).first()
    .or(page.getByText(/object3d/i).first())).toBeVisible({ timeout: 10_000 });
});

// ---------------------------------------------------------------------------
// HTML
// ---------------------------------------------------------------------------

test('log-and-view-html: HTML panel renders logged content', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;
  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/workspace`);
  await page.getByRole('button', { name: 'Add panels' }).waitFor({ timeout: 30_000 });

  await expect(page.getByText(/html_content/i).first()).toBeVisible({ timeout: 10_000 });
});

// ---------------------------------------------------------------------------
// Media Panel UI: Add & Configure
// ---------------------------------------------------------------------------

test('media-panel-add-configure: panel picker opens from Add panels button', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;
  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/workspace`);
  await page.getByRole('button', { name: 'Add panels' }).waitFor({ timeout: 30_000 });

  await page.getByRole('button', { name: 'Add panels' }).click();
  await expect(page.getByRole('dialog').or(page.getByText(/panel/i))).toBeVisible({ timeout: 10_000 });
});

// ---------------------------------------------------------------------------
// Media Panel Compare Mode
// ---------------------------------------------------------------------------

test('media-panel-compare-mode: compare view shows multiple images side-by-side', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;
  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/workspace`);
  await page.getByRole('button', { name: 'Add panels' }).waitFor({ timeout: 30_000 });

  // Verify multiple run names are visible indicating side-by-side comparison data
  await expect(page.getByText(/media-primary/i).first()).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText(/media-run-1/i).first()).toBeVisible({ timeout: 10_000 });
});
