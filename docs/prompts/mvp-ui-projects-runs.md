# MVP UI — Projects & Runs Prompt

**Date:** 2026-04-15

## Objective

Create an MVP UI based on the specs referenced in `docs/specs/AGENT.md`.

Specifically, this is for **projects and runs**. No artifacts yet. No code preview yet. Just the ability to view run metrics in various plots.

## Methodology: CRISPY

1. **Context** — create a set of research questions
2. **Research** — answer these questions; discover facts about the world
3. **Design** — come up with spec for this
4. **Plan** — divide the spec into vertical slices that span multiple subsystems rather than trying to create a whole subsystem all at once; that way you can verify each incremental piece of end-to-end functionality and make sure we are not layering work on the bad assumption that what we have already done works. Include an ordered list of vertical slices and detailed verification process for each including manual steps that the agent can run, and e2e, unit, or smoke tests that are worth adding to our persistent test suite.
5. **Implement** — Go through the work, slice by slice. Creating a plan for each slice, implementing the plan one step at a time, and verifying the step before moving on to the next one.

## Constraints

- **DO NOT MODIFY THE BACKEND API.** Only use functionality that is already there.
- If you get stuck on a limitation of the current implementation of the backend API, ask the user for further guidance.
- Make use of the API as-is.
- You are free to write more Python scripts (like those in the smoke tests dir) to send different metadata to the UI to validate display correctness.
- You are welcome to use the Chrome MCP server and take screenshots to validate UX and layout.
- Ask for review each time you come up with a new plan.
