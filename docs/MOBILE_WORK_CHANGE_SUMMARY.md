# Mobile Work Change Summary

## Did gameplay behavior change?
Short answer: **no intentional gameplay tuning or mechanic changes** were made.

What did change at runtime:
- `src/main.js` now exposes `globalThis.__ECHOFALL_TEST_API__` for automated tests.
- This API is observational/control-oriented for tests (snapshot, frame stepping, deterministic triggers).
- Core game loop, level content, physics constants, HUD behavior, enemy logic, and character mechanics were not refactored as part of this setup.

Risk note:
- Any code change can have unintended side effects, so a manual sanity check is still recommended.

## Should you test manually?
Yes — do a short sanity pass before commit/ship.

Recommended quick checks (5-10 minutes):
1. Launch `game.html` and play from title screen normally.
2. Verify movement, jump, and `Q` skill on at least 2-3 characters.
3. Pause/unpause (`P`) and restart (`R`) to confirm normal behavior.
4. Complete one level transition and confirm no stuck input state.
5. Confirm audio still behaves as expected during normal play.

## What was added/updated

### Modified
- `README.md`
  - Added links to new mobile planning/testing docs.
- `src/main.js`
  - Added global test API block (`__ECHOFALL_TEST_API__`) near startup.

### Added (tooling/tests)
- `package.json`
  - Added Playwright scripts and dev dependency.
- `package-lock.json`
  - Added lockfile for reproducible installs.
- `playwright.config.js`
  - Added mobile emulation test configuration.
- `tests/mobile-controls.spec.js`
  - Added mobile smoke tests (load, movement/jump/skill, pause/restart).
- `.gitignore`
  - Added ignore rules for `node_modules/`, Playwright outputs, and debug logs.

### Added (planning/docs)
- `docs/MOBILE_DEVICE_ROADMAP.md`
- `docs/MOBILE_PHASE1_SPRINT_TASKS.md`
- `docs/MOBILE_PHASE1_IMPLEMENTATION_NOTES.md`
- `docs/MOBILE_AUTOMATED_TESTS.md`
- `docs/GITHUB_ACTIONS_MOBILE_CI_DECISION_GUIDE.md`

## Validation completed
- Automated suite run: `npm run test:mobile`
- Result: passing on configured emulation projects.

## Suggested next step
- Run the short manual sanity pass above, then commit all intended files together.
