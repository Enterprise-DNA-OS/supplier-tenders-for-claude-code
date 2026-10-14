---
description: "Record a clarification answer and evidence"
---

# Record a clarification answer and evidence

Read CLAUDE.md first. Read the relevant tender before changing records.

Run `npm run tenders -- answer`. Accepted options: `--clarification=`, `--answer=`, `--evidence=`. Fill values from the operator and the existing records, never from a guess.

Use `--json` for structured output. For writes include `--actor=` naming the responsible person. Present ambiguous matches and ask which record is intended. Explain failures without bypassing them. Present currencies separately, keep incomplete totals and scores blank, and cite source evidence.

Nothing sends from this command. Drafts remain internal.
