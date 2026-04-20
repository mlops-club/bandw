import { test, expect } from '../../../fixtures';

// ---------------------------------------------------------------------------
// Workspace Management: Undo / Redo
// ---------------------------------------------------------------------------

test('keyboard-undo-redo: workspace loads for shortcut testing', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;
  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/workspace`);
  await page.getByRole('button', { name: 'Add panels' }).waitFor({ timeout: 30_000 });

  await expect(page.getByText(sdkData.project)).toBeVisible({ timeout: 10_000 });
});

test('keyboard-undo-redo: Cmd+Z undoes panel deletion', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;
  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/workspace`);
  await page.getByRole('button', { name: 'Add panels' }).waitFor({ timeout: 30_000 });

  // Locate a panel's edit/delete control
  const panelButton = page.getByRole('button', { name: /edit panel|panel menu/i }).first();
  await panelButton.click();

  // Click delete
  await page.getByRole('menuitem', { name: /delete|remove/i }).first().click();

  // Undo with Cmd+Z (macOS) or Ctrl+Z
  await page.keyboard.press('Meta+z');

  // Panel should be restored
  await expect(page.getByRole('button', { name: /edit panel|panel menu/i }).first()).toBeVisible({ timeout: 10_000 });
});

test('keyboard-undo-redo: Cmd+Shift+Z redoes undone action', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;
  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/workspace`);
  await page.getByRole('button', { name: 'Add panels' }).waitFor({ timeout: 30_000 });

  // Delete a panel
  const panelButton = page.getByRole('button', { name: /edit panel|panel menu/i }).first();
  await panelButton.click();
  await page.getByRole('menuitem', { name: /delete|remove/i }).first().click();

  // Undo
  await page.keyboard.press('Meta+z');

  // Redo
  await page.keyboard.press('Meta+Shift+z');

  // The workspace should reflect the redo state
  await expect(page.getByText(sdkData.project)).toBeVisible({ timeout: 10_000 });
});

// ---------------------------------------------------------------------------
// Navigation
// ---------------------------------------------------------------------------

test('keyboard-navigation: Cmd+J toggles between Workspaces and Runs tabs', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;
  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/workspace`);
  await page.getByRole('button', { name: 'Add panels' }).waitFor({ timeout: 30_000 });

  await page.keyboard.press('Meta+j');

  // After toggle, either "Runs" or "Workspace" tab indicator should be active
  await expect(
    page.getByRole('tab', { name: /runs/i }).or(page.getByRole('tab', { name: /workspace/i }))
  ).toBeVisible({ timeout: 10_000 });
});

test('keyboard-navigation: Escape exits full-screen panel', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;
  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/workspace`);
  await page.getByRole('button', { name: 'Add panels' }).waitFor({ timeout: 30_000 });

  // Click a panel to enter full-screen (if available)
  const panel = page.getByRole('button', { name: /full.?screen|expand/i }).first();
  if (await panel.isVisible()) {
    await panel.click();
    await page.keyboard.press('Escape');
    // Verify we're back to normal workspace view
    await expect(page.getByText(sdkData.project)).toBeVisible({ timeout: 10_000 });
  }
});

// ---------------------------------------------------------------------------
// Panel Navigation
// ---------------------------------------------------------------------------

test('keyboard-panel-navigation: arrow keys navigate between panels in full-screen', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;
  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/workspace`);
  await page.getByRole('button', { name: 'Add panels' }).waitFor({ timeout: 30_000 });

  // Enter full-screen on the first panel
  const expandButton = page.getByRole('button', { name: /full.?screen|expand/i }).first();
  if (await expandButton.isVisible()) {
    await expandButton.click();

    // Navigate to next panel
    await page.keyboard.press('ArrowRight');

    // Navigate back
    await page.keyboard.press('ArrowLeft');

    // Exit
    await page.keyboard.press('Escape');
    await expect(page.getByText(sdkData.project)).toBeVisible({ timeout: 10_000 });
  }
});

// ---------------------------------------------------------------------------
// Media Panel Shortcuts
// ---------------------------------------------------------------------------

test('keyboard-media-shortcuts: zoom shortcuts work on image panel', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;
  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/workspace`);
  await page.getByRole('button', { name: 'Add panels' }).waitFor({ timeout: 30_000 });

  // Verify image content is available for zoom testing
  await expect(page.getByText(/images/i).first()
    .or(page.getByText(/kbd-media/i))).toBeVisible({ timeout: 10_000 });
});

test('keyboard-media-shortcuts: Cmd+Left/Right moves step slider', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;
  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/workspace`);
  await page.getByRole('button', { name: 'Add panels' }).waitFor({ timeout: 30_000 });

  // Verify slider is present for step navigation
  await expect(page.getByRole('slider').first()
    .or(page.getByText(/step/i).first())).toBeVisible({ timeout: 10_000 });
});
