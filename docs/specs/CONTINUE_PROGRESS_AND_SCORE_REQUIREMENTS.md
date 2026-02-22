# Continue Progress + Score Scaling — Requirements

## 1) Objective
Implement a persistence-backed `CONTINUE` flow that:
- lets players resume from their highest unlocked level,
- resets run resources (`score`, `coins`, `lives`) on continue start,
- protects leaderboard integrity by reducing score gains when run does not start at level 1.

## 2) Scope
- Title screen `CONTINUE` enable/disable state.
- Persisted progress source for highest unlocked level.
- Continue-start run initialization.
- Score gain scaling for non-level-1 starts.

Out of scope:
- Checkpoint-in-level restoration (position/state rewind).
- New save-slot UI.
- Difficulty tuning unrelated to continue.

## 3) Definitions
- `highestUnlockedLevelIndex`: max level index unlocked by player profile.
- `runStartLevelIndex`: level index used when the current run begins.
- `isFullRun`: `runStartLevelIndex === 0`.
- `runScoreMultiplier`: score multiplier applied to all positive score gains in run.

## 4) Functional Requirements

### FR-1: Progress Persistence
- System must persist `highestUnlockedLevelIndex` locally.
- Value must be clamped to `[0, LEVELS.length - 1]` on load.
- Persistence read/write failures must fail safe (default to `0`, no crash).

### FR-2: Unlock Advancement
- On level clear, unlock progress updates to at least the cleared level's next index (when valid).
- Progress must be monotonic non-decreasing during normal play.

### FR-3: Continue Availability
- `CONTINUE` is enabled when `highestUnlockedLevelIndex > 0`.
- If unavailable, keep disabled style in menu (no dead action).

### FR-4: Continue Start Rules
When player selects `CONTINUE`:
- Run starts at `highestUnlockedLevelIndex`.
- `score = 0`, `coins = 0`, `lives = 3`, `nextExtraLifeCoins = 200`.
- Character-unlock/profile state remains untouched unless separately specified.

### FR-5: Score Scaling Rule (Baseline)
- If `runStartLevelIndex === 0`, `runScoreMultiplier = 1.0`.
- If `runStartLevelIndex > 0`, `runScoreMultiplier = 0.5`.
- Multiplier applies to all positive score grants via run scoring path.
- Do not apply multiplier to non-score counters (coins/lives).

### FR-6: Visibility / UX
- Show run status in HUD/title context while run is active:
  - `FULL RUN x1.0` when starting at level 1.
  - `CONTINUE RUN x0.5` when starting at later level.
- Messaging must be visible enough to avoid hidden penalties.

### FR-7: High Score Handling
- Keep existing `HI` score behavior unless leaderboard mode split is adopted.
- If mode split is later adopted, store full-run and continue-run highs independently.

## 5) Edge Cases
- New player: no saved progress -> `highestUnlockedLevelIndex = 0`, `CONTINUE` disabled.
- Corrupt persisted value -> sanitize to `0`.
- Level count shrink/expansion -> clamp saved index into valid range.
- Debug level jumps must not silently rewrite profile progress unless explicitly intended.

## 6) Acceptance Criteria

### AC-1: Continue Enablement
Given saved `highestUnlockedLevelIndex = 4`, title menu shows enabled `CONTINUE`.

### AC-2: Continue Reset
Given active profile and player chooses `CONTINUE`, run starts on level index 4 with:
- `score = 0`
- `coins = 0`
- `lives = 3`

### AC-3: Score Multiplier on Continue
Given run starts at level index 4 and event grants base `+100`, awarded score is `+50`.

### AC-4: Full Run Unchanged
Given run starts at level index 0 and event grants base `+100`, awarded score is `+100`.

### AC-5: Coin/Life Isolation
Given continue run, coin and life systems remain unscaled by score multiplier.

## 7) Balancing Alternatives (If 0.5 Feels Too Harsh)

### Option A — Soft Cap (Recommended Alternative)
- Non-level-1 starts use `runScoreMultiplier = 0.75` instead of `0.5`.
- Pros: less punishing, better for short-session players.
- Cons: weaker separation between full-run and continue competition.

### Option B — Dynamic by Start Depth
- Multiplier based on `runStartLevelIndex` depth, e.g.:
  - Level 2-3 starts: `0.9`
  - Level 4-6 starts: `0.75`
  - Level 7+ starts: `0.6`
- Pros: more proportional fairness.
- Cons: more complex to explain and test.

### Option C — Fixed Tax Instead of Multiplier
- Keep `x1.0` scoring but apply one-time score tax at run start (e.g., `-2000`, floored at 0).
- Pros: easy to communicate; keeps moment-to-moment score excitement.
- Cons: exploitable depending on level value density.

### Option D — Separate Boards, No Penalty
- Keep all runs at `x1.0`; split records into `FULL RUN` and `CONTINUE/PRACTICE`.
- Pros: strongest fairness/clarity, no perceived punishment.
- Cons: needs additional UI/record tracking.

## 8) Recommendation
Ship baseline quickly with FR-5 (`x0.5`) only if strongly prioritizing full-run prestige.
If retention/approachability is priority, choose Option A (`x0.75`) + explicit run label first.