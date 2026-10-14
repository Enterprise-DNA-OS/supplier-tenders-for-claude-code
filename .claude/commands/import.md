---
description: "Preview and import a mapped Market Dojo bid export"
---

# Preview and import a mapped Market Dojo bid export

Read CLAUDE.md first. Read the relevant tender before changing records.

Run `npm run tenders -- import market-dojo --file=examples/market-dojo-bids.csv --dry-run --actor="Migration operator"`. Accepted options: `--file=`, `--map=`, `--dry-run=`. Fill values from the operator and the existing records, never from a guess.

Use `--json` for structured output. For writes include `--actor=` naming the responsible person. Present ambiguous matches and ask which record is intended. Explain failures without bypassing them. Present currencies separately, keep incomplete totals and scores blank, and cite source evidence.

The example headings are a supported mapping contract, not a captured tenant export. Read docs/replace-market-dojo.md. Preview first, inspect counts and raw rows, then import with the operator's authority. Changed repeat imports stop for reconciliation.
