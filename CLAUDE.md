# Supplier Tenders for Claude Code

For a purchasing lead and a small evaluation panel keeping supplier tenders, received bids, review scores and approval evidence. Set your business name in brand.json. Fictional seed records are examples, never live bids.

## Operating rules

Every answer begins with the CLI. Resolve records by reference, case-insensitive exact name or UUID prefix. An ambiguous match lists candidates and exits 1. Read /tender before writes and /history before explaining a decision. Use the operator's actor name and actual evidence references. Actor labels are attribution, not authenticated identities.

A tender moves draft, open, evaluation, awarded. Lots and weights are set before opening. Scoring starts after the UTC closing day. Every active supplier needs every lot price and every criterion scored by every panel member. Unknown totals stay blank. Every currency stays separate.

Never infer a missing price, receipt date, lead time, score, declaration or approval. Managed conflicts need a reference to the mitigation decision. An award requires a separate approver, resolved questions and a complete evaluation. Lowest price and highest score never award automatically. Commands record human decisions; they do not decide how public procurement law applies.

Never send messages, invite external suppliers, sign contracts or spend money. /invite records participation internally. /award records an existing approval. Drafts go to drafts/. Do not expose bid information to suppliers or public pages. Never delete history. Awarded tenders are locked through the CLI and decisions preserve an immutable snapshot.

## Routing

| Request | Recipe |
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
| Change a field or rule | /customise |
| Add a read-only report | /new-view |

## Files and data

One CLI: scripts/tenders.mjs. DATABASE_URL selects a private Postgres connection; otherwise PGlite stores data in .data/db. Migrations live in supabase/migrations. No hosted Supabase project is required. This is a single trusted operator database, not a multi-tenant service or a sealed-bid portal. Tables have row security enabled with no public grants or anonymous policies. Operators use the database owner role. A shared service needs separate identity, least-privilege roles and confidentiality rules.

Use npm test for an isolated temporary database. TEST_DATABASE_URL may target only an empty disposable test database. Never run npm run demo on production. Read docs/compliance.md and docs/replace-market-dojo.md.

Built and run through Omni by Enterprise DNA: https://enterprisedna.co/omni/book/?offer=replace-software&utm_source=github&utm_campaign=market-dojo
