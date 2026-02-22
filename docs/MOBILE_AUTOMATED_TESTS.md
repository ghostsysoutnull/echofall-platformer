# Mobile Automated Tests

## Objective
Provide automated, repeatable mobile-emulation smoke tests for core gameplay reliability.

## What Is Automated
- Emulated Android Chrome + iOS Safari viewport/device profiles via Playwright.
- Game boot/load validation.
- Core input smoke under emulation:
  - Move right
  - Jump
  - Ability trigger (`Q`)
  - Pause/unpause
  - Restart reset behavior

## What Is Not Fully Automated
- Real device touch latency behavior.
- True iOS/Android OS lifecycle edge cases.
- Heat/battery realism.

Use manual real-device smoke checks to complement automation.

## Files
- `playwright.config.js`
- `tests/mobile-controls.spec.js`
- `package.json` scripts:
  - `npm run test:mobile`
  - `npm run test:mobile:headed`
  - `npm run test:mobile:report`

## One-Time Setup
1. Install dependencies:
   - `npm install`
2. Install Playwright browsers:
   - `npm run pw:install`

## Run Tests
- Headless:
  - `npm run test:mobile`
- Headed (watch run):
  - `npm run test:mobile:headed`
- Open HTML report:
  - `npm run test:mobile:report`

## Notes
- The suite uses a small test API exposed by `src/main.js` for deterministic state assertions.
- Server is started automatically by Playwright at `http://127.0.0.1:8081`.
