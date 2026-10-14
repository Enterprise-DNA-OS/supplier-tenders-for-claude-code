# Record a reviewer score and its rationale

Read CLAUDE.md first. Read the relevant tender before changing records.

Run `npm run tenders -- score`. Accepted options: `--tender=`, `--supplier=`, `--criterion=`, `--reviewer=`, `--value=`, `--rationale=`. Fill values from the operator and the existing records, never from a guess.

Use `--json` for structured output. For writes include `--actor=` naming the responsible person. Present ambiguous matches and ask which record is intended. Explain failures without bypassing them. Present currencies separately, keep incomplete totals and scores blank, and cite source evidence.

The actor must match the named reviewer, with a clear or managed declaration. A managed declaration needs the mitigation evidence reference. Do not choose scores for the reviewer.
