import { test as base, type Page } from "@playwright/test";

/** Target identifier — which backend+frontend pair we're testing against. */
export type Target = "bandw" | "wandb";

/** Resolved target config available to every test. */
export interface TargetConfig {
  target: Target;
  baseURL: string;
  apiBaseURL: string;
  apiKey: string;
  entity: string;
}

function resolveConfig(target: Target): TargetConfig {
  if (target === "wandb") {
    return {
      target,
      baseURL: "https://REMOVED",
      apiBaseURL: "https://REMOVED",
      apiKey: process.env.WANDB_API_KEY ?? "",
      entity: process.env.WANDB_ENTITY ?? "",
    };
  }
  return {
    target,
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
    async ({}, use, workerInfo) => {
      const target = (workerInfo.project.name as Target) || "bandw";
      const config = resolveConfig(target);
      await use(config);
    },
    { scope: "worker" },
  ],

  authedPage: async ({ page, targetConfig }, use) => {
    if (targetConfig.target === "bandw") {
      // Set localStorage API key before any navigation.
      // Use addInitScript to inject the key before the page JS runs,
      // avoiding a redirect race with the root page.
      await page.addInitScript((key) => {
        localStorage.setItem("wandb-api-key", key);
      }, targetConfig.apiKey);
    }

    if (targetConfig.target === "wandb") {
      // Set the OneTrust opt-out cookie directly to prevent the cookie
      // consent banner from appearing. This avoids navigating to wandb.ai
      // home page just to click "Reject All".
      await page.context().addCookies([
        {
          name: "OptanonAlertBoxClosed",
          value: new Date().toISOString(),
          domain: ".wandb.ai",
          path: "/",
        },
        {
          name: "OptanonConsent",
          value: "isGpcEnabled=0&datestamp=" + encodeURIComponent(new Date().toISOString()) + "&version=202409.2.0&browserGpcFlag=0&isIABGlobal=false&hosts=&landingPath=NotLandingPage&groups=C0001%3A1%2CC0002%3A0%2CC0003%3A0%2CC0004%3A0",
          domain: ".wandb.ai",
          path: "/",
        },
      ]);
    }

    await use(page);
  },
});

export { expect } from "@playwright/test";
