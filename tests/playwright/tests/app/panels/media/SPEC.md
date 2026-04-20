# Media Panels Test Plan

**W&B Docs Pages:**
- https://docs.wandb.ai/models/app/features/panels/media
- https://docs.wandb.ai/models/track/log/media

**Test Directory:** `tests/playwright/tests/media-panels/`
**Priority:** P2

---

## Media Logging → UI Verification

### Images

#### Test: `log-and-view-images.spec.ts`
**SDK Setup:** `setup_media_run.py` (logs `wandb.Image` from numpy arrays with captions)

| # | Step | Assertion |
|---|---|---|
| 1 | Navigate to workspace | Media panels visible |
| 2 | Locate image panel | Panel with logged images present |
| 3 | Verify step slider available | Slider for temporal comparison |
| 4 | Move step slider | Images change per step |
| 5 | Click image for full-screen view | Full-screen with zoom/pan |
| 6 | Verify caption displayed | Caption text matches SDK input |

### Image Overlays: Segmentation Masks

#### Test: `log-and-view-segmentation-masks.spec.ts`
**SDK Setup:** `setup_media_run.py` (logs `wandb.Image` with `masks={}`)

| # | Step | Assertion |
|---|---|---|
| 1 | Navigate to workspace → image panel | Panel loads |
| 2 | Verify mask overlay toggles visible | Opacity/toggle controls |
| 3 | Adjust mask opacity | Overlay transparency changes |
| 4 | Verify class labels shown | Labels match SDK class_labels dict |

### Image Overlays: Bounding Boxes

#### Test: `log-and-view-bounding-boxes.spec.ts`
**SDK Setup:** `setup_media_run.py` (logs `wandb.Image` with `boxes={}`)

| # | Step | Assertion |
|---|---|---|
| 1 | Navigate to workspace → image panel | Panel loads |
| 2 | Verify bounding boxes rendered | Rectangles visible on image |
| 3 | Filter boxes by class | Subset of boxes shown |
| 4 | Verify score-based filtering | Threshold controls available |

### Image Overlays in Tables

#### Test: `log-and-view-image-overlays-in-tables.spec.ts`
**SDK Setup:** `setup_media_run.py` (logs a `wandb.Table` containing images with masks and boxes)

| # | Step | Assertion |
|---|---|---|
| 1 | Navigate to the logged table view | Table loads |
| 2 | Open a row containing an image with overlays | Image viewer opens |
| 3 | Verify segmentation mask and bounding box overlays are available | Overlay controls are visible |

### Histograms

#### Test: `log-and-view-histograms.spec.ts`
**SDK Setup:** `setup_media_run.py` (logs `wandb.Histogram`)

| # | Step | Assertion |
|---|---|---|
| 1 | Navigate to workspace | Histogram panel visible |
| 2 | Verify heatmap visualization (steps x values) | Heatmap renders |
| 3 | Verify temporal comparison via step axis | Steps on x-axis |

### Audio

#### Test: `log-and-view-audio.spec.ts`
**SDK Setup:** `setup_media_run.py` (logs `wandb.Audio`)

| # | Step | Assertion |
|---|---|---|
| 1 | Navigate to workspace → media panel | Audio panel visible |
| 2 | Verify playback controls present | Play/pause button |
| 3 | Verify caption displayed | Caption matches SDK |

### Video

#### Test: `log-and-view-video.spec.ts`
**SDK Setup:** `setup_media_run.py` (logs `wandb.Video`)

| # | Step | Assertion |
|---|---|---|
| 1 | Navigate to workspace → media section | Video panel visible |
| 2 | Verify video player renders | Player controls present |

### 3D Point Clouds

#### Test: `log-and-view-point-clouds.spec.ts`
**SDK Setup:** `setup_media_run.py` (logs `wandb.Object3D`)

| # | Step | Assertion |
|---|---|---|
| 1 | Navigate to workspace → 3D panel | Point cloud renders |
| 2 | Verify interactive 3D controls | Mouse interaction works |
| 3 | Verify bounding boxes if logged | 3D boxes visible |

### HTML

#### Test: `log-and-view-html.spec.ts`
**SDK Setup:** `setup_media_run.py` (logs `wandb.Html`)

| # | Step | Assertion |
|---|---|---|
| 1 | Navigate to run page | HTML panel visible |
| 2 | Verify custom HTML renders | Content matches logged HTML |

### Text

#### Test: `log-and-view-text.spec.ts`
**SDK Setup:** `setup_media_run.py` (logs text content)

| # | Step | Assertion |
|---|---|---|
| 1 | Navigate to the run workspace or run detail surface that shows text media | Text panel or row is visible |
| 2 | Verify logged text content renders | Text matches SDK input |

### 2D view of a molecule

#### Test: `log-and-view-molecule.spec.ts`
**SDK Setup:** `setup_media_run.py` (logs a supported molecule visualization)

| # | Step | Assertion |
|---|---|---|
| 1 | Navigate to the run workspace or media surface | Molecule visualization is visible |
| 2 | Verify the 2D molecular rendering loads without error | Visualization renders |

---

## Media Panel UI Features (from /panels/media)

### Add and Configure Media Panel

#### Test: `media-panel-add-configure.spec.ts`
**SDK Setup:** `setup_media_run.py`

| # | Step | Assertion |
|---|---|---|
| 1 | Click "Add panels" | Panel picker opens |
| 2 | Select media panel type | Media panel added |
| 3 | Open media panel settings for a named panel | Configuration tabs open |
| 4 | Verify "Display" tab (title, media key, slider config) | Settings accessible |
| 5 | Verify "Layout" tab (run/media limits, gallery/grid/compare modes) | Layout options present |
| 6 | Switch between Gallery, Grid, Compare modes | Layout changes |

### Media Panel Compare Mode

#### Test: `media-panel-compare-mode.spec.ts`
**SDK Setup:** `setup_media_run.py` (multiple runs with images)

| # | Step | Assertion |
|---|---|---|
| 1 | Configure media panel in Compare mode | Compare view active |
| 2 | Set column count (2-4) | Multiple images side-by-side |
| 3 | Configure fan-out by Step | Different steps compared |
| 4 | Link/unlink variables | Synchronized or independent navigation |

### Media Panel Sync

#### Test: `media-panel-sync.spec.ts`
**SDK Setup:** `setup_media_run.py`

| # | Step | Assertion |
|---|---|---|
| 1 | Open section settings → Sync tab | Sync options visible |
| 2 | Enable "Sync slider by key" | Sliders synchronized across panels |
| 3 | Move one slider | All synced panels update |

### Overlays Configuration

#### Test: `media-panel-overlays.spec.ts`
**SDK Setup:** `setup_media_run.py` (images with segmentation masks)

| # | Step | Assertion |
|---|---|---|
| 1 | Open panel config → Overlays tab | Overlay controls visible |
| 2 | Search/filter overlays by name | Overlays filter |
| 3 | Customize overlay colors | Colors change |

---

## SDK Setup Scripts Required

- `setup_media_run.py` (comprehensive: images, masks, boxes, audio, video, point clouds, histograms, HTML)

## Total Tests: 16
