import { type Page, type Locator } from "@playwright/test";

/**
 * Page object for the runs table (project workspace view).
 * Uses ARIA-first selectors.
 */
export class RunsTablePage {
  readonly page: Page;
  readonly table: Locator;
  readonly searchBox: Locator;
  readonly filterButton: Locator;
  readonly sortButton: Locator;
  readonly groupButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.table = page.getByRole("table", { name: /runs/i });
    this.searchBox = page.getByRole("searchbox", { name: /search/i });
    this.filterButton = page.getByRole("button", { name: /filter runs/i });
    this.sortButton = page.getByRole("button", { name: /sort runs/i });
    this.groupButton = page.getByRole("button", { name: /group runs/i });
  }

  /** Navigate to a project's workspace page. */
  async goto(baseURL: string, entity: string, project: string) {
    await this.page.goto(`${baseURL}/${entity}/${project}`);
    await this.table.waitFor({ state: "visible", timeout: 30_000 });
  }

  /** Get all visible row locators in the runs table. */
  rows(): Locator {
    return this.table.getByRole("row");
  }

  /** Get a specific run row by its display name text. */
  rowByName(name: string): Locator {
    return this.table.getByRole("row").filter({ hasText: name });
  }

  /** Get column header cells. */
  headers(): Locator {
    return this.table.getByRole("columnheader");
  }

  /** Click a run name to navigate to its detail page. */
  async clickRun(name: string) {
    await this.rowByName(name).getByRole("link").first().click();
  }

  /** Type into the search box. */
  async search(query: string) {
    await this.searchBox.fill(query);
  }

  /** Select/check a run row (for bulk operations). */
  async selectRun(name: string) {
    await this.rowByName(name).getByRole("checkbox").check();
  }
}
