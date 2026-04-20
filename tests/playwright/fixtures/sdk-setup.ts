import { test as base } from "./base";
import { execFileSync } from "child_process";
import path from "path";
import fs from "fs";

/** Manifest returned by every setup.py script. */
export interface SdkManifest {
  project: string;
  entity: string;
  runs: Array<{
    id: string;
    name: string;
    displayName?: string;
  }>;
  artifacts: Array<{
    name: string;
    type: string;
    version: string;
  }>;
  extra: Record<string, unknown>;
}

const playwrightRoot = path.resolve(__dirname, "..");

/**
 * Run a folder's setup.py via `uv run` and parse its JSON stdout.
 */
function runSdkSetup(
  setupScriptPath: string,
  env: Record<string, string>
): SdkManifest {
  const result = execFileSync(
    "uv",
    ["run", "--project", playwrightRoot, "python", setupScriptPath],
    {
      cwd: playwrightRoot,
      env: { ...process.env, ...env },
      timeout: 120_000,
      encoding: "utf-8",
    }
  );

  const lines = result.trim().split("\n");
  const jsonLine = lines[lines.length - 1];
  return JSON.parse(jsonLine) as SdkManifest;
}

/**
 * File-based lock + cache for SDK setup.
 *
 * Each test folder gets a `.manifest.json` file that persists the SDK
 * setup result. A `.manifest.lock` file acts as a mutex so only one
 * worker runs setup.py per folder — others wait and read the result.
 *
 * This enables full parallel execution: N workers can run tests from
 * the same folder without re-running setup.py or creating duplicate
 * wandb projects.
 */
function getOrCreateManifest(
  testDir: string,
  setupScript: string,
  env: Record<string, string>
): SdkManifest {
  const manifestPath = path.join(testDir, ".manifest.json");
  const lockPath = path.join(testDir, ".manifest.lock");

  // Fast path: manifest already exists from a previous run or another worker
  if (fs.existsSync(manifestPath)) {
    return JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
  }

  // Try to acquire lock (atomic file creation)
  try {
    fs.writeFileSync(lockPath, process.pid.toString(), { flag: "wx" });
  } catch {
    // Another worker holds the lock — poll until manifest appears
    const deadline = Date.now() + 120_000;
    while (!fs.existsSync(manifestPath)) {
      if (Date.now() > deadline) {
        throw new Error(`Timed out waiting for SDK setup in ${testDir}`);
      }
      execFileSync("sleep", ["0.5"]);
    }
    return JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
  }

  // We hold the lock — run setup.py
  try {
    const manifest = runSdkSetup(setupScript, env);
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    return manifest;
  } finally {
    // Release lock
    try { fs.unlinkSync(lockPath); } catch {}
  }
}

/**
 * Fixture that runs SDK setup and provides the manifest to tests.
 *
 * Uses file-based locking so setup.py runs exactly once per test folder,
 * even across multiple parallel Playwright workers.
 */
export const test = base.extend<{ sdkData: SdkManifest }>({
  sdkData: async ({ targetConfig }, use, testInfo) => {
    const testDir = path.dirname(testInfo.file);
    const setupScript = path.join(testDir, "setup.py");

    if (!fs.existsSync(setupScript)) {
      await use({
        project: "",
        entity: targetConfig.entity,
        runs: [],
        artifacts: [],
        extra: {},
      });
      return;
    }

    const env: Record<string, string> = {
      WANDB_BASE_URL: targetConfig.apiBaseURL,
      WANDB_API_KEY: targetConfig.apiKey,
      WANDB_ENTITY: targetConfig.entity,
    };

    const manifest = getOrCreateManifest(testDir, setupScript, env);
    await use(manifest);
  },
});

export { expect } from "@playwright/test";
export type { TargetConfig } from "./base";
