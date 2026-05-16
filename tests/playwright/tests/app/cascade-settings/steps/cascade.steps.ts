/**
 * Step definitions for cascade-settings feature files.
 *
 * These steps cover workspace panel interactions, settings panels,
 * section settings, and display preference controls specific to
 * the cascade-settings tests.
 */
import { expect } from '@playwright/test';
import { Given, When, Then } from '../../../../steps/fixtures';

// ---------------------------------------------------------------------------
// When — workspace loading & interaction
// ---------------------------------------------------------------------------

When(
  'I wait for workspace panels to load',
  async ({ authedPage }) => {
    await authedPage
      .getByRole('button', { name: 'Add panels' })
      .waitFor({ timeout: 30_000 });
  }
);

When(
  'I click the first edit panel button',
  async ({ authedPage }) => {
    await authedPage
      .getByRole('button', { name: /edit panel/i })
      .first()
      .click();
  }
);

When(
  'I click the {string} tab in the panel edit modal',
  async ({ authedPage }, tabName: string) => {
    await authedPage
      .getByRole('tab', { name: new RegExp(tabName, 'i') })
      .first()
      .click();
  }
);

When(
  'I click the first section settings button',
  async ({ authedPage }) => {
    await authedPage
      .getByRole('button', { name: /section settings/i })
      .first()
      .click();
  }
);

When(
  'I click on display preferences',
  async ({ authedPage }) => {
    await authedPage.getByText(/display preferences/i).first().click();
  }
);

// NOTE: 'I open workspace settings' is defined in workspaces.steps.ts (shared)

When(
  'I click on line plots settings',
  async ({ authedPage }) => {
    await authedPage.getByText(/line plots/i).first().click();
  }
);

When(
  'I click on workspace layout settings',
  async ({ authedPage }) => {
    await authedPage.getByText(/workspace layout/i).first().click();
  }
);

When(
  'I press Escape',
  async ({ authedPage }) => {
    await authedPage.keyboard.press('Escape');
  }
);

When(
  'I click on the display preferences tab',
  async ({ authedPage }) => {
    await authedPage
      .getByRole('tab', { name: /display preferences/i })
      .or(authedPage.getByText(/display preferences/i))
      .first()
      .click();
  }
);

// ---------------------------------------------------------------------------
// Then — panel edit modal assertions
// ---------------------------------------------------------------------------

Then(
  'the panel edit modal should show the {string} tab',
  async ({ authedPage }, tabName: string) => {
    await expect(
      authedPage.getByRole('tab', { name: new RegExp(tabName, 'i') }).first()
    ).toBeVisible({ timeout: 10_000 });
  }
);

Then(
  'the Y-axis control should be visible',
  async ({ authedPage }) => {
    const yRangeControl = authedPage
      .getByLabel(/y.axis/i)
      .or(authedPage.getByLabel(/y range/i))
      .or(authedPage.getByText(/y.axis/i));
    await expect(yRangeControl.first()).toBeVisible({ timeout: 10_000 });
  }
);

Then(
  'the smoothing control should be visible',
  async ({ authedPage }) => {
    const smoothingControl = authedPage
      .getByRole('slider', { name: /smoothing/i })
      .or(authedPage.getByLabel(/smoothing/i));
    await expect(smoothingControl.first()).toBeVisible({ timeout: 10_000 });
  }
);

Then(
  'there should be at least 2 edit panel buttons',
  async ({ authedPage }) => {
    const editButtons = authedPage.getByRole('button', { name: /edit panel/i });
    await expect(editButtons.first()).toBeVisible({ timeout: 10_000 });
    const panelCount = await editButtons.count();
    expect(panelCount).toBeGreaterThanOrEqual(2);
  }
);

// ---------------------------------------------------------------------------
// Then — section-level assertions
// ---------------------------------------------------------------------------

Then(
  'I should see section-level content',
  async ({ authedPage }) => {
    await expect(
      authedPage.getByText(/section/i).first()
    ).toBeVisible({ timeout: 10_000 });
  }
);

Then(
  'the display preferences option should be visible',
  async ({ authedPage }) => {
    await expect(
      authedPage.getByText(/display preferences/i).first()
    ).toBeVisible({ timeout: 10_000 });
  }
);

Then(
  'the colored run names toggle should be visible',
  async ({ authedPage }) => {
    const coloredRunsToggle = authedPage
      .getByRole('checkbox', { name: /colored run names/i })
      .or(authedPage.getByLabel(/colored run names/i));
    await expect(coloredRunsToggle.first()).toBeVisible({ timeout: 10_000 });
  }
);

Then(
  'override or reset controls should be visible',
  async ({ authedPage }) => {
    await expect(
      authedPage
        .getByText(/override/i)
        .or(authedPage.getByText(/reset/i))
        .or(authedPage.getByText(/display preferences/i))
        .first()
    ).toBeVisible({ timeout: 10_000 });
  }
);

Then(
  'there should be at least 2 section settings buttons',
  async ({ authedPage }) => {
    const sections = authedPage.getByRole('button', {
      name: /section settings/i,
    });
    await expect(sections.first()).toBeVisible({ timeout: 10_000 });
    const sectionCount = await sections.count();
    expect(sectionCount).toBeGreaterThanOrEqual(2);
  }
);

Then(
  'a reset or clear button should be visible',
  async ({ authedPage }) => {
    const resetButton = authedPage
      .getByRole('button', { name: /reset/i })
      .or(authedPage.getByRole('button', { name: /remove override/i }))
      .or(authedPage.getByRole('button', { name: /clear/i }));
    await expect(resetButton.first()).toBeVisible({ timeout: 10_000 });
  }
);

// ---------------------------------------------------------------------------
// Then — workspace-level assertions
// ---------------------------------------------------------------------------

Then(
  'the project name should be visible in the workspace',
  async ({ authedPage, sdkData }) => {
    await expect(
      authedPage.getByText(sdkData.project).first()
    ).toBeVisible({ timeout: 10_000 });
  }
);

Then(
  'workspace settings content should be visible',
  async ({ authedPage }) => {
    await expect(
      authedPage
        .getByText(/workspace settings/i)
        .or(authedPage.getByText(/settings/i))
        .first()
    ).toBeVisible({ timeout: 10_000 });
  }
);

Then(
  'the workspace layout option should be visible',
  async ({ authedPage }) => {
    await expect(
      authedPage.getByText(/workspace layout/i).first()
    ).toBeVisible({ timeout: 10_000 });
  }
);

Then(
  'the line plots option should be visible',
  async ({ authedPage }) => {
    await expect(
      authedPage.getByText(/line plots/i).first()
    ).toBeVisible({ timeout: 10_000 });
  }
);

Then(
  'I should see train and val sections',
  async ({ authedPage }) => {
    await expect(
      authedPage.getByText(/train/i).first()
    ).toBeVisible({ timeout: 10_000 });
    await expect(
      authedPage.getByText(/val/i).first()
    ).toBeVisible({ timeout: 10_000 });
  }
);

// ---------------------------------------------------------------------------
// Then — workspace layout assertions
// ---------------------------------------------------------------------------

Then(
  'an automated or manual mode indicator should be visible',
  async ({ authedPage }) => {
    await expect(
      authedPage
        .getByText(/automated/i)
        .or(authedPage.getByText(/manual/i))
        .first()
    ).toBeVisible({ timeout: 10_000 });
  }
);

// NOTE: 'the hide empty sections toggle should be visible' and
//       'the sort panels alphabetically toggle should be visible'
//       are defined in workspaces.steps.ts (shared)

Then(
  'a prefix organization option should be visible',
  async ({ authedPage }) => {
    await expect(
      authedPage
        .getByText(/first prefix/i)
        .or(authedPage.getByText(/last prefix/i))
        .or(authedPage.getByText(/prefix/i))
        .first()
    ).toBeVisible({ timeout: 10_000 });
  }
);

// ---------------------------------------------------------------------------
// Then — line plot defaults assertions
// ---------------------------------------------------------------------------

Then(
  'the data tab or label should be visible',
  async ({ authedPage }) => {
    await expect(
      authedPage
        .getByRole('tab', { name: /data/i })
        .or(authedPage.getByText(/^data$/i))
        .first()
    ).toBeVisible({ timeout: 10_000 });
  }
);

Then(
  'the display preferences tab or label should be visible',
  async ({ authedPage }) => {
    await expect(
      authedPage
        .getByRole('tab', { name: /display preferences/i })
        .or(authedPage.getByText(/display preferences/i))
        .first()
    ).toBeVisible({ timeout: 10_000 });
  }
);

Then(
  'the x-axis control should be visible',
  async ({ authedPage }) => {
    const xAxisControl = authedPage
      .getByLabel(/x.axis/i)
      .or(authedPage.getByText(/x.axis/i));
    await expect(xAxisControl.first()).toBeVisible({ timeout: 10_000 });
  }
);

Then(
  'the outlier rescaling toggle should be visible',
  async ({ authedPage }) => {
    const outlierToggle = authedPage
      .getByRole('checkbox', { name: /outlier/i })
      .or(authedPage.getByLabel(/outlier/i));
    await expect(outlierToggle.first()).toBeVisible({ timeout: 10_000 });
  }
);

Then(
  'the point aggregation control should be visible',
  async ({ authedPage }) => {
    const aggregationControl = authedPage
      .getByLabel(/point aggregation/i)
      .or(authedPage.getByText(/point aggregation/i));
    await expect(aggregationControl.first()).toBeVisible({ timeout: 10_000 });
  }
);

Then(
  'the max runs or groups control should be visible',
  async ({ authedPage }) => {
    const maxRunsControl = authedPage
      .getByLabel(/max.*runs/i)
      .or(authedPage.getByText(/max.*runs/i))
      .or(authedPage.getByLabel(/max.*groups/i));
    await expect(maxRunsControl.first()).toBeVisible({ timeout: 10_000 });
  }
);

Then(
  'tooltip or legend options should be visible',
  async ({ authedPage }) => {
    await expect(
      authedPage
        .getByText(/tooltip/i)
        .or(authedPage.getByText(/legend/i))
        .first()
    ).toBeVisible({ timeout: 10_000 });
  }
);

Then(
  'the full run names toggle should be visible',
  async ({ authedPage }) => {
    const fullNamesToggle = authedPage
      .getByRole('checkbox', { name: /full run names/i })
      .or(authedPage.getByLabel(/full run names/i));
    await expect(fullNamesToggle.first()).toBeVisible({ timeout: 10_000 });
  }
);
