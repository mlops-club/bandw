import { defineConfig } from '@playwright/test';
import path from 'path';
import fs from 'fs';

const wandbAuthFile = path.join(__dirname, '.auth', 'wandb-storage-state.json');
const hasWandbAuth = fs.existsSync(wandbAuthFile);

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 4 : undefined,
  outputDir: 'test-results/',
  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on',
  },
  projects: [
    {
      name: 'wandb-auth-setup',
      testMatch: /auth\.setup\.ts/,
    },
    {
      name: 'bandw',
      use: { baseURL: 'http://localhost:5173' },
      outputDir: 'test-videos/bandw',
      timeout: 15_000, // Local server — fast timeouts
    },
    {
      name: 'wandb',
      use: {
        baseURL: 'https://REMOVED',
        ...(hasWandbAuth ? { storageState: wandbAuthFile } : {}),
      },
      outputDir: 'test-videos/wandb',
      timeout: 60_000, // Remote — slower
      dependencies: hasWandbAuth ? [] : ['wandb-auth-setup'],
    },
  ],
});
