/**
 * BDD fixture bridge.
 *
 * playwright-bdd requires that createBdd() receives a test object extended
 * from its own `test` export. We rebuild the fixture chain on top of
 * playwright-bdd's test instead of @playwright/test's test.
 */
import { test as bddTest } from 'playwright-bdd';
import { createBdd } from 'playwright-bdd';
import type { Page } from '@playwright/test';
import type { TargetConfig } from '../fixtures/base';
import type { SdkManifest } from '../fixtures/sdk-setup';
import { execFileSync } from 'child_process';
import path from 'path';
import fs from 'fs';

// ---------------------------------------------------------------------------
// Layer 1: targetConfig (worker-scoped) — same logic as fixtures/base.ts
// ---------------------------------------------------------------------------

function resolveConfig(): TargetConfig {
  return {
    target: 'bandw',
    baseURL: process.env.BANDW_BASE_URL ?? 'http://localhost:5173',
    apiBaseURL: process.env.BANDW_API_URL ?? 'http://localhost:8080',
    apiKey: process.env.BANDW_API_KEY ?? '1dbac5a5d91172ad159b7978bec36bb8c3b0a5f5',
    entity: process.env.BANDW_ENTITY ?? 'admin',
  };
}

// ---------------------------------------------------------------------------
// Layer 2: SDK setup — same logic as fixtures/sdk-setup.ts
// ---------------------------------------------------------------------------

const playwrightRoot = path.resolve(__dirname, '..');

function runSdkSetup(setupScriptPath: string, env: Record<string, string>): SdkManifest {
  const result = execFileSync(
    'uv',
    ['run', '--project', playwrightRoot, 'python', setupScriptPath],
    {
      cwd: playwrightRoot,
      env: { ...process.env, ...env },
      timeout: 120_000,
      encoding: 'utf-8',
    }
  );
  const lines = result.trim().split('\n');
  const jsonLine = lines[lines.length - 1];
  return JSON.parse(jsonLine) as SdkManifest;
}

function getOrCreateManifest(
  testDir: string,
  setupScript: string,
  env: Record<string, string>
): SdkManifest {
  const manifestPath = path.join(testDir, '.manifest.json');
  const lockPath = path.join(testDir, '.manifest.lock');

  if (fs.existsSync(manifestPath)) {
    return JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
  }

  try {
    fs.writeFileSync(lockPath, process.pid.toString(), { flag: 'wx' });
  } catch {
    const deadline = Date.now() + 120_000;
    while (!fs.existsSync(manifestPath)) {
      if (Date.now() > deadline) {
        throw new Error(`Timed out waiting for SDK setup in ${testDir}`);
      }
      execFileSync('sleep', ['0.5']);
    }
    return JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
  }

  try {
    const manifest = runSdkSetup(setupScript, env);
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    return manifest;
  } finally {
    try { fs.unlinkSync(lockPath); } catch {}
  }
}

// ---------------------------------------------------------------------------
// Compose: extend playwright-bdd's test with all our fixtures
// ---------------------------------------------------------------------------

export const test = bddTest.extend<
  { authedPage: Page; sdkData: SdkManifest },
  { targetConfig: TargetConfig }
>({
  targetConfig: [
    async ({}, use) => {
      const config = resolveConfig();
      await use(config);
    },
    { scope: 'worker' },
  ],

  authedPage: async ({ page, targetConfig }, use) => {
    await page.addInitScript((key) => {
      localStorage.setItem('wandb-api-key', key);
    }, targetConfig.apiKey);

    await use(page);
  },

  sdkData: async ({ targetConfig }, use, testInfo) => {
    // Generated BDD specs live in .features-gen/tests/... but setup.py
    // lives in the original tests/... directory. Remap the path.
    let testDir = path.dirname(testInfo.file);
    const featuresGenMarker = path.join('.features-gen', 'tests');
    if (testDir.includes(featuresGenMarker)) {
      testDir = testDir.replace(featuresGenMarker, 'tests');
    }
    const setupScript = path.join(testDir, 'setup.py');

    if (!fs.existsSync(setupScript)) {
      await use({
        project: '',
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

export const { Given, When, Then } = createBdd(test);
