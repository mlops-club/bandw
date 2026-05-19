/**
 * Step definitions for tables/core feature files.
 *
 * Reuses: common.steps.ts, project-page.steps.ts
 */
import { expect } from '@playwright/test';
import { Given, When, Then } from '../../../../steps/fixtures';

// ---------------------------------------------------------------------------
// When — run detail navigation
// ---------------------------------------------------------------------------

When(
  'I open the first run detail page',
  async ({ authedPage, targetConfig, sdkData }) => {
    const run = sdkData.runs[0];
    const runId = run.displayName || run.name || run.id;
    await authedPage.goto(
      `${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/runs/${runId}`
    );
    await authedPage.getByText('Name').first().waitFor({ timeout: 30_000 });
  }
);

When(
  'I open the second run detail page',
  async ({ authedPage, targetConfig, sdkData }) => {
    const run = sdkData.runs[1];
    const runId = run.displayName || run.name || run.id;
    await authedPage.goto(
      `${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/runs/${runId}`
    );
    await authedPage.getByText('Name').first().waitFor({ timeout: 30_000 });
  }
);

When(
  'I open the second run artifacts tab',
  async ({ authedPage, targetConfig, sdkData }) => {
    const run = sdkData.runs[1];
    const runId = run.displayName || run.name || run.id;
    await authedPage.goto(
      `${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/runs/${runId}/artifacts`
    );
  }
);

When(
  'I open the third run artifacts tab',
  async ({ authedPage, targetConfig, sdkData }) => {
    const run = sdkData.runs[2];
    const runId = run.displayName || run.name || run.id;
    await authedPage.goto(
      `${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/runs/${runId}/artifacts`
    );
  }
);

When(
  'I open the fourth run artifacts tab',
  async ({ authedPage, targetConfig, sdkData }) => {
    const run = sdkData.runs[3];
    const runId = run.displayName || run.name || run.id;
    await authedPage.goto(
      `${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/runs/${runId}/artifacts`
    );
  }
);

// ---------------------------------------------------------------------------
// Then — table assertions
// ---------------------------------------------------------------------------

Then(
  'I should see predictions table content',
  async ({ authedPage }) => {
    await expect(
      authedPage.getByRole('heading', { name: /predictions/i })
        .or(authedPage.getByText('predictions'))
    ).toBeVisible({ timeout: 10_000 });
  }
);

Then(
  'I should see column header {string}',
  async ({ authedPage }, headerName: string) => {
    await expect(
      authedPage.getByRole('columnheader', { name: headerName })
    ).toBeVisible({ timeout: 10_000 });
  }
);

Then(
  'I should see table rows',
  async ({ authedPage }) => {
    await expect(authedPage.getByRole('row').first()).toBeVisible({ timeout: 10_000 });
  }
);

When(
  'I click the {string} column header',
  async ({ authedPage }, headerName: string) => {
    await authedPage.getByRole('columnheader', { name: headerName }).or(authedPage.getByText(headerName).first()).click();
  }
);

When(
  'I click the table filter button',
  async ({ authedPage }) => {
    await authedPage.getByRole('button', { name: /filter/i }).click();
  }
);

// NOTE: "I should see filter UI" is defined in workspaces.steps.ts — do not duplicate

Then(
  'I should see filter text',
  async ({ authedPage }) => {
    await expect(authedPage.getByText(/filter/i)).toBeVisible({ timeout: 10_000 });
  }
);

// ---------------------------------------------------------------------------
// When — artifact navigation
// ---------------------------------------------------------------------------

When(
  'I click on the eval predictions artifact',
  async ({ authedPage }) => {
    await authedPage.getByText('eval_predictions').first().click();
  }
);

When(
  'I click on the table-version-a artifact',
  async ({ authedPage }) => {
    await authedPage.getByText('table-version-a').click();
  }
);

When(
  'I click the compare button',
  async ({ authedPage }) => {
    await authedPage.getByRole('button', { name: /compare/i }).click();
  }
);

// ---------------------------------------------------------------------------
// Then — comparison assertions
// ---------------------------------------------------------------------------

Then(
  'I should see eval predictions or artifact content',
  async ({ authedPage }) => {
    await expect(
      authedPage.getByText(/eval_predictions/i)
        .or(authedPage.getByText(/artifact/i)).first()
    ).toBeVisible({ timeout: 10_000 });
  }
);

Then(
  'I should see prediction column header',
  async ({ authedPage }) => {
    await expect(
      authedPage.getByRole('columnheader', { name: 'pred' })
        .or(authedPage.getByText('pred'))
    ).toBeVisible({ timeout: 10_000 });
  }
);

Then(
  'I should see eval predictions or version content',
  async ({ authedPage }) => {
    await expect(
      authedPage.getByText(/eval_predictions/i)
        .or(authedPage.getByText(/v\d+/)).first()
    ).toBeVisible({ timeout: 10_000 });
  }
);

Then(
  'I should see compare or diff text',
  async ({ authedPage }) => {
    await expect(
      authedPage.getByText(/compare/i).or(authedPage.getByText(/diff/i))
    ).toBeVisible({ timeout: 10_000 });
  }
);

Then(
  'I should see score column content',
  async ({ authedPage }) => {
    await expect(
      authedPage.getByText('score')
        .or(authedPage.getByRole('columnheader', { name: 'score' }))
    ).toBeVisible({ timeout: 10_000 });
  }
);

Then(
  'I should see table version or dataset content',
  async ({ authedPage }) => {
    await expect(
      authedPage.getByText('table-version-a')
        .or(authedPage.getByText('dataset'))
    ).toBeVisible({ timeout: 10_000 });
  }
);

Then(
  'I should see compare text',
  async ({ authedPage }) => {
    await expect(authedPage.getByText(/compare/i)).toBeVisible({ timeout: 10_000 });
  }
);

When(
  'I click the join key dropdown',
  async ({ authedPage }) => {
    await authedPage
      .getByRole('combobox', { name: /join key/i })
      .or(authedPage.getByLabel(/join key/i))
      .click();
  }
);

Then(
  'I should see join key option {string}',
  async ({ authedPage }, optionText: string) => {
    await expect(
      authedPage.getByRole('option', { name: optionText })
        .or(authedPage.getByText(optionText))
    ).toBeVisible({ timeout: 10_000 });
  }
);

When(
  'I select side-by-side view',
  async ({ authedPage }) => {
    await authedPage
      .getByRole('combobox', { name: /view/i })
      .or(authedPage.getByLabel(/view/i))
      .click();
    await authedPage
      .getByRole('option', { name: /list of/i })
      .or(authedPage.getByText(/side.*by.*side/i))
      .click();
  }
);

Then(
  'I should see pagination controls',
  async ({ authedPage }) => {
    await expect(
      authedPage.getByRole('button', { name: /page/i })
        .or(authedPage.getByText(/rows per page/i))
    ).toBeVisible({ timeout: 10_000 });
  }
);

When(
  'I toggle vertical layout',
  async ({ authedPage }) => {
    await authedPage
      .getByRole('switch', { name: /vertical/i })
      .or(authedPage.getByLabel(/vertical/i))
      .click();
  }
);

// ---------------------------------------------------------------------------
// When — step slider
// ---------------------------------------------------------------------------

When(
  'I click the add panel button',
  async ({ authedPage }) => {
    await authedPage.getByRole('button', { name: /add panel/i }).click();
  }
);

When(
  'I click the query option',
  async ({ authedPage }) => {
    await authedPage.getByText(/query/i).click();
  }
);

Then(
  'I should see stepper or slider content',
  async ({ authedPage }) => {
    await expect(
      authedPage.getByText(/stepper/i).or(authedPage.getByRole('slider'))
    ).toBeVisible({ timeout: 10_000 });
  }
);

Then(
  'I should see a step slider control',
  async ({ authedPage }) => {
    const slider = authedPage.getByRole('slider', { name: /step/i })
      .or(authedPage.getByLabel(/step/i));
    await expect(slider.first()).toBeVisible({ timeout: 10_000 });
  }
);

Then(
  'I should see eval predictions or score content',
  async ({ authedPage }) => {
    await expect(
      authedPage.getByText(/eval_predictions/i)
        .or(authedPage.getByText('score'))
    ).toBeVisible({ timeout: 10_000 });
  }
);

Then(
  'I should see table or prediction content',
  async ({ authedPage }) => {
    await expect(
      authedPage.getByRole('table').or(authedPage.getByText('pred'))
    ).toBeVisible({ timeout: 10_000 });
  }
);
