# Hunt Queue — State Account Files

This directory holds the pre-validated account lists that feed Hunt Window Agents.

## Structure

```
hunt-queue/
  {STATE_CODE}/
    accounts-{YYYY-MM-DD}.csv           ← managed agent output (raw filter from master contacts)
    accounts-{YYYY-MM-DD}_validated.csv  ← state agent output (clean, flagged, ready for hunt)
    validation-{YYYY-MM-DD}.md          ← state agent notes: flags, closed accounts, known relationships
  pending-handoff.json                  ← accounts confirmed by reps, awaiting Alex batch approval
```

## Flow

1. Hunting Coordinator triggers managed agent → writes `accounts-{date}.csv` for the target state
2. State Agent reads raw CSV → validates → writes `_validated.csv` + `validation-{date}.md`
3. Hunt Window Agent spawns → reads `_validated.csv` as its Stage 1 input
4. After hunt cycle, confirmed listings land in `pending-handoff.json` until Alex approves Farming Layer handoff

## Naming Convention

State code: 2-letter uppercase (US states) or 2-letter uppercase (CA provinces: ON, AB, BC, SK, MB, QC)
Date: ISO format YYYY-MM-DD matching the hunt window start date

Examples:
- `CO/accounts-2026-04-13.csv`
- `CO/accounts-2026-04-13_validated.csv`
- `CO/validation-2026-04-13.md`
- `TX/accounts-2026-04-21.csv`
- `ON/accounts-2026-04-28.csv`
