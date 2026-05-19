import { type Page, type Locator } from "@playwright/test";

/**
 * Page object for the run detail view.
 * Covers tab navigation and common elements across all tabs.
 * Uses ARIA-first selectors.
 *
 * Tab names: Charts, Overview, Model, Logs, Files, Code, Artifacts
 */
export class RunDetailPage {
  readonly page: Page;
  readonly tabList: Locator;

  constructor(page: Page) {
    this.page = page;
    this.tabList = page.getByRole("tablist");
  }

  /** Navigate directly to a run's detail page (Charts tab by default). */
  async goto(
    baseURL: string,
    entity: string,
    project: string,
    runId: string
  ) {
    await this.page.goto(`${baseURL}/${entity}/${project}/runs/${runId}`);
    await this.tabList.waitFor({ state: "visible", timeout: 30_000 });
  }

  /** Navigate directly to a run's Overview tab. */
  async gotoOverview(
    baseURL: string,
    entity: string,
    project: string,
    runId: string
  ) {
    await this.page.goto(
      `${baseURL}/${entity}/${project}/runs/${runId}/overview`
    );
    await this.tabList.waitFor({ state: "visible", timeout: 30_000 });
  }

  /** Get a tab button by its name. */
  tab(name: string): Locator {
    return this.tabList.getByRole("tab", { name: new RegExp(name, "i") });
  }

  /** Click a tab and wait for its panel to appear. */
  async switchTab(name: string) {
    await this.tab(name).click();
    await this.page
      .getByRole("tabpanel")
      .first()
      .waitFor({ state: "visible", timeout: 10_000 });
  }

  /** Get the currently visible tab panel(s). */
  activePanel(): Locator {
    return this.page.getByRole("tabpanel");
  }

  /** Check which tab is currently selected. */
  async activeTabName(): Promise<string> {
    const selected = this.tabList.getByRole("tab", { selected: true });
    return (await selected.textContent()) ?? "";
  }

  // --- Overview tab helpers ---

  /** The run name heading inside the banner. */
  runName(): Locator {
    return this.page.locator("banner").getByRole("heading").first();
  }

  /** Get the run state text (e.g., "Finished", "Running"). */
  stateText(): Locator {
    return this.page.getByText(/Finished|Running|Crashed|Failed/);
  }

  /**
   * Config section on the Overview tab.
   * Structure: generic "Config" text, then list > listitem tree.
   * Use configKeys() to find specific key-value pairs.
   */
  configHeading(): Locator {
    return this.page.getByText("Config", { exact: true });
  }

  /** Search box inside the Config section. */
  configSearch(): Locator {
    return this.page
      .getByPlaceholder("Search keys with regex")
      .first();
  }

  /** Find a config key-value pair by key name. Returns a locator for the listitem. */
  configKey(keyName: string): Locator {
    return this.page
      .getByRole("list")
      .filter({ hasText: "Config parameters" })
      .getByText(keyName);
  }

  /**
   * Summary section on the Overview tab.
   * Same list structure as Config.
   */
  summaryHeading(): Locator {
    return this.page.getByText("Summary", { exact: true });
  }

  /** Search box inside the Summary section. */
  summarySearch(): Locator {
    return this.page
      .getByPlaceholder("Search keys with regex")
      .nth(1);
  }

  /** Find a summary key-value pair by key name. */
  summaryKey(keyName: string): Locator {
    return this.page
      .getByRole("list")
      .filter({ hasText: "Summary metrics" })
      .getByText(keyName);
  }

  // --- Metadata helpers (Overview tab) ---

  /** Get metadata value by label (e.g., "State", "Runtime", "Hostname"). */
  metadataValue(label: string): Locator {
    // Metadata is rendered as adjacent generic elements: label then value
    return this.page.getByText(label).locator("+ *");
  }

  // --- Charts tab helpers ---

  /** Find a chart panel by its metric title text. */
  chartPanel(metricName: string): Locator {
    return this.page.getByText(metricName, { exact: true });
  }

  // --- Logs tab helpers ---

  /** Get the logs container. */
  logsContainer(): Locator {
    return this.activePanel().getByRole("log");
  }

  // --- Files tab helpers ---

  /** Get the file browser tree/list. */
  fileBrowser(): Locator {
    return this.activePanel().getByRole("tree");
  }
}
