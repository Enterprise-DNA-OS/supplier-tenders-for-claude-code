# Record a separately approved award with a frozen evaluation snapshot

Read CLAUDE.md first. Read the relevant tender before changing records.

Run `npm run tenders -- award`. Accepted options: `--tender=`, `--supplier=`, `--rationale=`, `--evidence=`. Fill values from the operator and the existing records, never from a guess.

Use `--json` for structured output. For writes include `--actor=` naming the responsible person. Present ambiguous matches and ask which record is intended. Explain failures without bypassing them. Present currencies separately, keep incomplete totals and scores blank, and cite source evidence.

Require the operator to identify the exact decision and approval evidence. The approver must differ from the owner and evaluators. This records an approval already given; it never sends an award, signs a contract or authorises spending.
