import { test as base, type Page } from "@playwright/test";

/** Resolved target config available to every test. */
export interface TargetConfig {
  target: string;
  baseURL: string;
  apiBaseURL: string;
  apiKey: string;
  entity: string;
}

function resolveConfig(): TargetConfig {
  return {
    target: "bandw",
    baseURL: process.env.BANDW_BASE_URL ?? "http://localhost:5173",
    apiBaseURL: process.env.BANDW_API_URL ?? "http://localhost:8080",
    apiKey: process.env.BANDW_API_KEY ?? "1dbac5a5d91172ad159b7978bec36bb8c3b0a5f5",
    entity: process.env.BANDW_ENTITY ?? "admin",
  };
}

export const test = base.extend<
  { authedPage: Page },
  { targetConfig: TargetConfig }
>({
  targetConfig: [
    async ({}, use) => {
      const config = resolveConfig();
      await use(config);
    },
    { scope: "worker" },
  ],

  authedPage: async ({ page, targetConfig }, use) => {
    // Set localStorage API key before any navigation.
    // Use addInitScript to inject the key before the page JS runs,
    // avoiding a redirect race with the root page.
    await page.addInitScript((key) => {
      localStorage.setItem("wandb-api-key", key);
    }, targetConfig.apiKey);

    await use(page);
  },
});

export { expect } from "@playwright/test";
