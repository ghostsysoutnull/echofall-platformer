# Coin Death Penalty — Requirements

## 1) Objective
Implement a death penalty where player death reduces coins by **25%**.

## 2) Scope
- Applies to **coins only**.
- Does **not** reduce score.
- Applies on standard player death events (not debug/admin resets).

## 3) Definitions
- `coinsBeforeDeath`: coin count at the moment death is confirmed.
- `coinsLost`: amount removed due to death penalty.
- `coinsAfterDeath`: resulting coin count after penalty.

## 4) Functional Requirements

### FR-1: Death Penalty Calculation
On valid player death:
- `coinsLost = floor(coinsBeforeDeath * 0.25)`
- `coinsAfterDeath = max(0, coinsBeforeDeath - coinsLost)`

### FR-2: Single Application Per Death
The 25% reduction must be applied **once per death event**.
- No double-application while death animation/timer is running.

### FR-3: Score Isolation
Score is unaffected by this rule.
- Death coin penalty must not change score values.

### FR-4: Checkpoint/Respawn Compatibility
If the player respawns at a checkpoint, the coin penalty is already applied and carries forward.

### FR-5: Game Over Compatibility
If game-over flow resets progression, this rule still applies at death time before any game-over reset logic.

## 5) Rounding & Edge Cases
- Rounding uses `floor` for deterministic behavior.
- Examples:
  - 0 coins -> lose 0 -> remain 0
  - 1 coin -> lose 0 -> remain 1
  - 3 coins -> lose 0 -> remain 3
  - 4 coins -> lose 1 -> remain 3
  - 10 coins -> lose 2 -> remain 8
  - 99 coins -> lose 24 -> remain 75

## 6) UI/Feedback Requirements
- On death, show a temporary notice: `COIN PENALTY -<coinsLost>`.
- If `coinsLost = 0`, notice may be omitted or shown as `COIN PENALTY -0` based on HUD preference.

## 7) Telemetry / Debug (Optional but Recommended)
Track per run:
- death count
- total coins lost to death penalty
- average coins lost per death

## 8) Acceptance Criteria

### AC-1: Correct Math
Given `coinsBeforeDeath = 80`, when player dies, then `coinsAfterDeath = 60`.

### AC-2: Floor Rounding
Given `coinsBeforeDeath = 7`, when player dies, then `coinsAfterDeath = 6`.

### AC-3: No Negative Coins
Given `coinsBeforeDeath = 0`, when player dies, then `coinsAfterDeath = 0`.

### AC-4: No Score Impact
Given any death, score remains unchanged by coin penalty logic.

### AC-5: No Double Penalty
Given one death sequence, penalty is applied exactly once.

## 9) Out of Scope
- Changing skill costs.
- Changing coin gain rates from pickups/enemies.
- Adding interest, insurance, or penalty scaling systems.