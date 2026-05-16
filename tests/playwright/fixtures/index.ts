/**
 * Barrel export — import { test, expect } from '../../fixtures' in any spec.
 *
 * The fixture chain is: base → sdk-setup → network-recorder.
 * Importing from here gives you the fully composed test with all fixtures:
 *   - targetConfig: resolved target (bandw or wandb)
 *   - authedPage: browser page with auth pre-configured
 *   - sdkData: parsed manifest from setup.py (worker-scoped)
 *   - networkRecording: always-on HAR capture (worker-scoped, auto)
 */
export { test, expect } from "./network-recorder";
export type { SdkManifest } from "./sdk-setup";
export type { TargetConfig, Target } from "./base";
