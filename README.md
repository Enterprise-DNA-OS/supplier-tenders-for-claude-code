# Supplier Tenders for Claude Code

Supplier tenders, received bids, evaluation scores and award evidence in a database you own. Works with Claude Code, Codex, OpenCode or Cursor.

| Do it yourself | We customise it | We run it for you |
|---|---|---|
| Free MIT code. Install it and keep the records. | Your criteria, fields, Market Dojo mapping, a web front end or another stack when needed. | Installed and operated through Omni by Enterprise DNA. One setup fee, then a retainer. |

[Get your version built](https://enterprisedna.co/omni/book/?offer=replace-software&utm_source=github&utm_medium=readme&utm_campaign=market-dojo).

## What it does

A purchasing lead can prepare a tender, record supplier offers, follow up missing prices, collect panel scores and prepare a decision for a separate approver. Each award stores the comparisons, bids, criteria, scores and declarations used at the time. No supplier account or auction screen is needed for this internal evaluation workflow.

Market Dojo [lists](https://marketdojo.com/pricing/) Strategic Sourcing at GBP 2,000 a month on monthly billing, before taxes. Twelve months at that rate is GBP 24,000. Its annual licence is cheaper. This is list-price arithmetic, not a verified NZ or AU customer invoice or a savings promise. [Research and candidate scores](docs/research.md).

## Quick start

Node 20 or later.

```bash
git clone https://github.com/Enterprise-DNA-OS/supplier-tenders-for-claude-code.git
cd supplier-tenders-for-claude-code
npm install
npm run demo
npm run tenders -- weekly-review
npm run view
npm run docs
```

Open the folder in your coding agent and ask /weekly-review. With DATABASE_URL unset, the embedded PGlite database lives in .data/db. To use your own Postgres, set DATABASE_URL and run npm run migrate. Only seed a demo database. Agent subscriptions, hosting and operations have their own costs.

## Weekly work

35 CLI commands and /customise plus /new-view give 37 command recipes. All reads support --json. Writes require --actor=.

| Job | Command |
|---|---|
| List available commands and their accepted options | /help |
| Read the tender register | /tenders |
| Read a tender with bids, scoring and history | /tender |
| Check upcoming and overdue tender closing dates | /tenders-due |
| Find suppliers with missing lot prices | /bid-coverage |
| Find each missing reviewer score | /scoring-gaps |
| Compare complete bid totals and weighted scores | /comparison |
| Review unanswered supplier questions | /clarifications-due |
| Find overdue, incomplete and quiet tenders | /attention |
| Check declarations, coverage and evaluation evidence | /compliance |
| See suppliers active across several tenders | /supplier-load |
| Read approved award decisions | /award-register |
| Read the activity record | /history |
| Prepare the Monday review from dates, scores and questions | /weekly-review |
| Create a draft tender | /add |
| Register a supplier | /add-supplier |
| Define a lot and quantity before opening | /add-lot |
| Record supplier participation without sending an invitation | /invite |
| Set an evaluation criterion and its weight | /criterion |
| Add a panel member before evaluation | /add-reviewer |
| Record a conflict declaration and evidence | /declare |
| Assign the accountable owner of a draft tender | /set-owner |
| Confirm source dates and lead times on an imported bid | /reconcile-bid |
| Freeze tender lots and criteria and open the internal record | /open |
| Record one received supplier offer for a lot | /bid |
| Start evaluation after the closing day | /evaluate |
| Record a reviewer score and its rationale | /score |
| Record a supplier withdrawal with its reason | /withdraw |
| Record a question for follow-up | /clarify |
| Record a clarification answer and evidence | /answer |
| Record a separately approved award with a frozen evaluation snapshot | /award |
| Record a tender note | /log |
| Preview and import a mapped Market Dojo bid export | /import |
| Write all eleven record sets to a new JSON file | /export |
| Write an internal review draft without sending | /draft-review |

## Ten questions your own version answers

These combined checks run today. They describe this build, not an unsupported claim that Market Dojo cannot produce similar reports.

- Which tenders are overdue and still missing evaluator scores? attention
- Which apparently cheap suppliers have not priced every lot? bid-coverage
- Which complete offers combine price, lead time and evaluation score? comparison
- Which reviewer has not scored which supplier on which criterion? scoring-gaps
- Which unanswered questions are already overdue? clarifications-due
- Which panel members still need conflict declarations? compliance
- Which tenders have been quiet for two weeks while work remains open? attention
- Which suppliers appear in several active tenders? supplier-load
- Which imported bids still lack confirmed receipt dates and lead times? compliance
- What exact evidence and comparisons supported an approved award? tender

## Your first hour: ten things to ask for

1. Put our business name on the evaluation brief.
2. Show missing bid prices alongside closing dates.
3. Identify pending panel declarations.
4. Show each missing score by reviewer.
5. Compare complete offers in the tender's currency.
6. List questions with overdue answers.
7. Preview our exported bid records without saving.
8. Draft the Monday tender review.
9. Add a department field through a migration.
10. Add an owner-specific read-only report.

## Working rules

Create lots, criteria totalling 100 and a panel while the tender is a draft. Record participants with invite, then open. This does not publish a tender or send invitations. Record bids with their receipt date and evidence. Each participant quotes every lot. Duplicate submissions stop for a reviewed correction through /customise, never silent replacement.

After the closing day, evaluate starts scoring. A reviewer declares conflicts before scoring. Values run from 0 to 5, with a required rationale. Weighted score = sum of score times criterion weight divided by 5, averaged over the whole panel. Incomplete panels return a blank score. Price stays separate from quality. A person decides which offer represents value.

Resolve all questions and record any supplier withdrawal with its reason. award requires complete bids and scores for every active participant, clear or managed declarations, and an approver separate from both owner and panel. It records an approval with its evidence; it does not place an order, create a contract or send a supplier notice. Dates are calendar dates in UTC, not a time-of-day sealed submission deadline.

## Switch from Market Dojo

```bash
npm run tenders -- import market-dojo --file=examples/market-dojo-bids.csv --dry-run --actor="Migration operator"
npm run tenders -- import market-dojo --file=examples/market-dojo-bids.csv --actor="Migration operator"
```

Market Dojo documents export reports. Prepare a CSV with one supplier, lot and bid per row. Use --map=examples/import-map.json for your headings. The fixture demonstrates the supported mapping contract, not a captured export from a tenant. Pivoted spreadsheets require reshaping first. The one-command import then preserves original fields, loads draft tenders and refuses changed repeats. Dates received and lead times stay unknown until reconciled. [Full replacement guide](docs/replace-market-dojo.md).

## Documents and views

brand.json holds business name, logo and colours. npm run docs generates evaluation briefs, probity records and award records. npm run view generates the weekly work and evaluation snapshots. Open the read-only HTML files under docs-out/ and views/, or print to PDF. Confidential bids and internal scores stay with authorised reviewers.

## Trust and scope

A single organisation's internal evaluation desk. No public supplier portal, live auction, bidder messaging, sealed bid custody, electronic signatures, purchasing or payment processing. [Why no front end](docs/why-no-front-end.md).

[Compliance checks](docs/compliance.md) are record checks based on cited guidance and local policies. They do not certify procurement legality or cover every public tender obligation. Names and evidence references are operator-supplied, not verified identity or signatures. An owner can access all records; database administrators can alter the underlying system. Keep database backups and evidence documents separately.

## Tests

npm test uses a temporary database and exercises all 35 commands, repeatable migrations and seeds, missing bids, blank incomplete scores, conflict declarations, separate approval, locked awards, immutable decision records, atomic imports, dry runs, changed-source rejection, exports and escaped HTML. The GitHub workflow runs the suite on Linux, Windows and PostgreSQL 16.

MIT licence. Not affiliated with Market Dojo or Anthropic. [Book 30 minutes with Sam](https://enterprisedna.co/omni/book/?offer=replace-software&utm_source=github&utm_campaign=market-dojo).
