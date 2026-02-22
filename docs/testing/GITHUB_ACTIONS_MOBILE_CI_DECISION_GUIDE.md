# GitHub Actions Mobile CI — Decision Guide

## Purpose
Help decide if/when to enable automated mobile Playwright checks in GitHub Actions for this project.

## Context
Current state:
- Local mobile emulation tests exist and pass via Playwright.
- Team can run checks manually with local commands.
- No hosted CI workflow is configured yet.

Decision to make later:
- Enable GitHub-hosted CI for mobile regression checks on push/PR, or continue manual execution only.

## What You Gain If You Enable CI
1. Automatic regression detection on pull requests.
2. Merge confidence from repeatable browser-emulation checks.
3. Shared visibility (green/red checks in PRs) for all contributors.
4. Easier debugging with uploaded failure artifacts (screenshots, video, traces).

## Trade-Offs / Costs
1. GitHub Actions runner minutes may incur cost depending on plan/repo type.
2. Browser-based tests take longer than lightweight unit tests.
3. CI maintenance overhead (workflow tuning, flaky test handling, artifact retention).
4. Emulation does not replace real-device smoke testing.

## Cost Sensitivity Levers (If Enabled)
Use these to keep spend low:
1. Trigger only on pull requests (not every push).
2. Run mobile suite only when relevant files change:
   - `src/**`
   - `game.html`
   - `audio/**`
   - `tests/**`
   - Playwright config/workflow files
3. Use one emulated profile by default; run the second profile on schedule/manual trigger.
4. Upload artifacts only on failure.
5. Keep artifact retention short (e.g., 3-7 days).

## Adoption Options

### Option A — Manual Only (Today)
- Keep current local-only process.
- Best if contribution volume is low and cost minimization is strict.

### Option B — Low-Cost CI (Recommended First Step)
- Run mobile tests on PRs only.
- Single device profile in default workflow.
- Failure-only artifacts and strict path filters.

### Option C — Full CI Coverage
- Run on PR + push to main.
- Multiple device profiles every run.
- Highest confidence, highest minute usage.

## Decision Matrix

Score each category 1 (low) to 5 (high):
- PR Volume:
- Recent Regression Frequency:
- Team Size / Number of Contributors:
- Need for Merge Gates:
- Budget Tolerance for CI Minutes:

Interpretation:
- Total 5-10: stay Manual Only
- Total 11-17: adopt Low-Cost CI
- Total 18-25: adopt Full CI Coverage

## Go/No-Go Checklist

### Go when all are true
- [ ] Budget owner accepts potential GitHub Actions minute usage.
- [ ] Team wants PR-level quality gates for mobile regressions.
- [ ] Test suite runtime is stable enough for CI (< ~10 minutes preferred).
- [ ] At least one owner is assigned for CI workflow maintenance.

### No-Go (delay) when any is true
- [ ] Repo/plan budget is unclear.
- [ ] Test flakiness is still high.
- [ ] Team is not ready to maintain CI failures/artifacts.

## Suggested Next Step When Ready
Start with Option B (Low-Cost CI), observe for 2-4 weeks, then decide:
- Keep as-is,
- expand to full coverage,
- or roll back to manual-only.

## Review Cadence
Revisit this decision:
- Monthly during active development, or
- immediately after a costly CI overage or major escaped regression.
