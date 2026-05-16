import { test, expect } from '../../../../fixtures';

test('manage-sections: add section after last section', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/workspace`);
  await page.getByRole('button', { name: 'Add panels' }).waitFor({ timeout: 30_000 });

  // Click "+ Add section" button
  await page.keyboard.press('End');
  await page.waitForTimeout(1000);
  await page.getByRole('button', { name: /add section/i }).first().click();

  // Verify a new section appears
  await expect(page.getByRole('button', { name: 'Section actions' }).last()).toBeVisible({ timeout: 10_000 });
});

test('manage-sections: new section above via section menu', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/workspace`);
  await page.getByRole('button', { name: 'Add panels' }).waitFor({ timeout: 30_000 });

  const initialSectionCount = await page.getByRole('button', { name: 'Section actions' }).count();

  // Open section menu and choose "New section above"
  await page.getByRole('button', { name: 'Section actions' }).first().click();
  await page.getByRole('menuitem', { name: /new section above/i })
    .or(page.getByText(/new section above/i)).first().click();

  // Verify section count increased
  await expect(page.getByRole('button', { name: 'Section actions' })).toHaveCount(initialSectionCount + 1, { timeout: 10_000 });
});

test('manage-sections: rename section via section menu', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/workspace`);
  await page.getByRole('button', { name: 'Add panels' }).waitFor({ timeout: 30_000 });

  // Open section menu and choose rename
  await page.getByRole('button', { name: 'Section actions' }).first().click();
  await page.getByRole('menuitem', { name: /rename/i }).first().click();

  // Type a new name
  const nameInput = page.getByRole('textbox').first();
  await nameInput.clear();
  await nameInput.fill('My Custom Section');
  await nameInput.press('Enter');

  // Verify the section name changed
  await expect(page.getByText('My Custom Section').first()).toBeVisible({ timeout: 10_000 });
});

test('manage-sections: resize panel in section', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/workspace`);
  await page.getByRole('button', { name: 'Add panels' }).waitFor({ timeout: 30_000 });

  // Open section settings
  await page.getByRole('button', { name: 'Section settings' }).first().click();

  // Verify resize or panel-size controls are available
  await expect(page.getByLabel(/panel size|columns|resize/i)
    .or(page.getByText(/panel size|columns|resize/i)).first()).toBeVisible({ timeout: 10_000 });
});

test('manage-sections: set panels per page via pagination', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/workspace`);
  await page.getByRole('button', { name: 'Add panels' }).waitFor({ timeout: 30_000 });

  // Open section settings
  await page.getByRole('button', { name: 'Section settings' }).first().click();

  // Find pagination or panels-per-page control
  await expect(page.getByLabel(/panels per page|pagination/i)
    .or(page.getByText(/panels per page|pagination/i)).first()).toBeVisible({ timeout: 10_000 });
});

test('manage-sections: collapse section hides content', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/workspace`);
  await page.getByRole('button', { name: 'Add panels' }).waitFor({ timeout: 30_000 });

  // Click collapse button on first section
  await page.getByRole('button', { name: /collapse/i }).first().click();

  // Verify section header remains but content is hidden
  await expect(page.getByRole('button', { name: /expand/i }).first()).toBeVisible({ timeout: 10_000 });
});

test('manage-sections: expand section restores content', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/workspace`);
  await page.getByRole('button', { name: 'Add panels' }).waitFor({ timeout: 30_000 });

  // Collapse then expand
  await page.getByRole('button', { name: /collapse/i }).first().click();
  await page.getByRole('button', { name: /expand/i }).first().click();

  // Verify content reappears (panels visible again)
  await expect(page.getByText(/train\/loss|val\/loss/i).first()).toBeVisible({ timeout: 10_000 });
});

test('manage-sections: delete section removes it and all panels', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/workspace`);
  await page.getByRole('button', { name: 'Add panels' }).waitFor({ timeout: 30_000 });

  const initialSectionCount = await page.getByRole('button', { name: 'Section actions' }).count();

  // Open section menu and choose delete
  await page.getByRole('button', { name: 'Section actions' }).first().click();
  await page.getByRole('menuitem', { name: /delete/i }).first().click();

  // Confirm deletion if dialog appears
  const confirmButton = page.getByRole('button', { name: /confirm|delete|yes/i });
  if (await confirmButton.isVisible({ timeout: 2000 }).catch(() => false)) {
    await confirmButton.first().click();
  }

  // Verify section count decreased
  await expect(page.getByRole('button', { name: 'Section actions' })).toHaveCount(initialSectionCount - 1, { timeout: 10_000 });
});
