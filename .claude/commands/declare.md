# Record a conflict declaration and evidence

Read CLAUDE.md first. Read the relevant tender before changing records.

Run `npm run tenders -- declare`. Accepted options: `--tender=`, `--reviewer=`, `--declaration=`, `--evidence=`. Fill values from the operator and the existing records, never from a guess.

Use `--json` for structured output. For writes include `--actor=` naming the responsible person. Present ambiguous matches and ask which record is intended. Explain failures without bypassing them. Present currencies separately, keep incomplete totals and scores blank, and cite source evidence.

Nothing sends from this command. Drafts remain internal.
