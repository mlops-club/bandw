/**
 * Step definitions for app/custom-charts feature files.
 *
 * Reuses: common.steps.ts, line-plot.steps.ts, project-page.steps.ts
 */
import { expect } from '@playwright/test';
import { Given, When, Then } from '../../../../steps/fixtures';

// ---------------------------------------------------------------------------
// When — run detail navigation for specific custom chart runs
// ---------------------------------------------------------------------------

When(
  'I open the custom line run detail page',
  async ({ authedPage, targetConfig, sdkData }) => {
    const run = sdkData.runs[0]; // "custom-line"
    const runId = run.displayName || run.name || run.id;
    await authedPage.goto(
      `${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/runs/${runId}`
    );
    await authedPage.getByText('Name').first().waitFor({ timeout: 30_000 });
  }
);

When(
  'I open the custom scatter run detail page',
  async ({ authedPage, targetConfig, sdkData }) => {
    const run = sdkData.runs[1]; // "custom-scatter"
    const runId = run.displayName || run.name || run.id;
    await authedPage.goto(
      `${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/runs/${runId}`
    );
    await authedPage.getByText('Name').first().waitFor({ timeout: 30_000 });
  }
);

When(
  'I open the custom bar run detail page',
  async ({ authedPage, targetConfig, sdkData }) => {
    const run = sdkData.runs[2]; // "custom-bar"
    const runId = run.displayName || run.name || run.id;
    await authedPage.goto(
      `${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/runs/${runId}`
    );
    await authedPage.getByText('Name').first().waitFor({ timeout: 30_000 });
  }
);

When(
  'I open the custom histogram run detail page',
  async ({ authedPage, targetConfig, sdkData }) => {
    const run = sdkData.runs[3]; // "custom-histogram"
    const runId = run.displayName || run.name || run.id;
    await authedPage.goto(
      `${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/runs/${runId}`
    );
    await authedPage.getByText('Name').first().waitFor({ timeout: 30_000 });
  }
);

When(
  'I open the custom pr-curve run detail page',
  async ({ authedPage, targetConfig, sdkData }) => {
    const run = sdkData.runs[4]; // "custom-pr-curve"
    const runId = run.displayName || run.name || run.id;
    await authedPage.goto(
      `${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/runs/${runId}`
    );
    await authedPage.getByText('Name').first().waitFor({ timeout: 30_000 });
  }
);

When(
  'I open the custom roc-curve run detail page',
  async ({ authedPage, targetConfig, sdkData }) => {
    const run = sdkData.runs[5]; // "custom-roc-curve"
    const runId = run.displayName || run.name || run.id;
    await authedPage.goto(
      `${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/runs/${runId}`
    );
    await authedPage.getByText('Name').first().waitFor({ timeout: 30_000 });
  }
);

When(
  'I open the custom table chart run detail page',
  async ({ authedPage, targetConfig, sdkData }) => {
    const run = sdkData.runs[6]; // "custom-table-chart"
    const runId = run.displayName || run.name || run.id;
    await authedPage.goto(
      `${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/runs/${runId}`
    );
    await authedPage.getByText('Name').first().waitFor({ timeout: 30_000 });
  }
);

When(
  'I open the edit target run detail page',
  async ({ authedPage, targetConfig, sdkData }) => {
    const run = sdkData.runs[7]; // "edit-target"
    const runId = run.displayName || run.name || run.id;
    await authedPage.goto(
      `${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/runs/${runId}`
    );
    await authedPage.getByText('Name').first().waitFor({ timeout: 30_000 });
  }
);

// ---------------------------------------------------------------------------
// Then — chart content assertions
// ---------------------------------------------------------------------------

Then(
  'I should see animal label text',
  async ({ authedPage }) => {
    await expect(
      authedPage.getByText('cat').or(authedPage.getByText('dog'))
    ).toBeVisible({ timeout: 10_000 });
  }
);

Then(
  'I should see SVG or canvas chart elements',
  async ({ authedPage }) => {
    await expect(
      authedPage.locator('svg rect, svg path, canvas').first()
    ).toBeVisible({ timeout: 10_000 });
  }
);

Then(
  'I should see SVG scatter or canvas chart elements',
  async ({ authedPage }) => {
    await expect(
      authedPage.locator('svg circle, svg path, canvas').first()
    ).toBeVisible({ timeout: 10_000 });
  }
);

Then(
  'I should see PR curve content',
  async ({ authedPage }) => {
    await expect(
      authedPage.getByText(/pr.curve/i).or(authedPage.getByText('pr-curve'))
    ).toBeVisible({ timeout: 10_000 });
  }
);

Then(
  'I should see ROC curve content',
  async ({ authedPage }) => {
    await expect(
      authedPage.getByText(/roc.curve/i).or(authedPage.getByText('roc-curve'))
    ).toBeVisible({ timeout: 10_000 });
  }
);

Then(
  'I should see training progress or table viz content',
  async ({ authedPage }) => {
    await expect(
      authedPage.getByText('Training Progress')
        .or(authedPage.getByText('custom-table-viz'))
    ).toBeVisible({ timeout: 10_000 });
  }
);

// ---------------------------------------------------------------------------
// When — edit interface
// ---------------------------------------------------------------------------

When(
  'I click on the editable chart',
  async ({ authedPage }) => {
    await authedPage.getByText('Editable Chart').click();
  }
);

When(
  'I click the chart edit button',
  async ({ authedPage }) => {
    await authedPage.getByRole('button', { name: /edit/i }).click();
  }
);

Then(
  'I should see edit text',
  async ({ authedPage }) => {
    await expect(authedPage.getByText(/edit/i)).toBeVisible({ timeout: 10_000 });
  }
);

Then(
  'I should see query editor content',
  async ({ authedPage }) => {
    await expect(
      authedPage.getByText(/query/i)
        .or(authedPage.getByRole('textbox', { name: /query/i }))
    ).toBeVisible({ timeout: 10_000 });
  }
);

Then(
  'I should see field mapping controls',
  async ({ authedPage }) => {
    await expect(
      authedPage.getByLabel(/x/i).or(authedPage.getByText(/field/i))
    ).toBeVisible({ timeout: 10_000 });
  }
);

When(
  'I click the x-axis mapping control',
  async ({ authedPage }) => {
    await authedPage
      .getByRole('combobox', { name: /x/i })
      .or(authedPage.getByLabel(/x.axis/i))
      .click();
  }
);

Then(
  'I should see mapping options',
  async ({ authedPage }) => {
    await expect(
      authedPage.getByRole('option').first()
        .or(authedPage.getByRole('listbox'))
    ).toBeVisible({ timeout: 10_000 });
  }
);

Then(
  'I should see chart type controls',
  async ({ authedPage }) => {
    await expect(
      authedPage.getByRole('combobox', { name: /chart type/i })
        .or(authedPage.getByText(/chart type/i))
        .or(authedPage.getByText(/visualization/i))
    ).toBeVisible({ timeout: 10_000 });
  }
);
