# Replace Market Dojo's internal evaluation records

Checked 14 October 2026.

## Export

Market Dojo's [help page](https://support.marketdojo.com/portal/en/kb/articles/how-do-i-see-a-participants-answers-to-a-questionnaire) describes Export Report, including bid information and event summaries, with export formats. Its [Analytics guide](https://support.marketdojo.com/portal/en/kb/articles/how-to-use-the-analytics-tab) describes spreadsheet exports and the RFQ report's Lot Matrix. Download from the account you are authorised to use. Preserve the original export and attachments.

Reports can be pivoted and custom lots differ. Export or reshape the relevant bid information to CSV with one row per event, supplier and lot. Do not treat a pivot total as a unit price. This build does not read XLSX directly or reconstruct arbitrary spreadsheet formulae.

## Mapping

| Local value | Default CSV heading | Treatment |
|---|---|---|
| Source event key | Event ID | Stable key, preserved as market-dojo source |
| Tender name | Event Name | Required and consistent within event |
| Supplier key and name | Supplier ID, Supplier Name | Stable key and consistent name |
| Lot key and name | Lot ID, Lot Name | Stable within event |
| Required quantity | Quantity | Positive number, no thousands separators |
| Unit price | Unit Price | Nonnegative decimal in event currency |
| Tender currency | Currency | Three uppercase letters, one currency per event |
| Closing date | Closing Date | Real YYYY-MM-DD date |

examples/import-map.json lets you map each local key to an actual heading. Extra original fields are retained in source_rows. The fixture is synthetic. A live tenant's column names have not been verified. A matrix export needs reshaping before this one-command import. No assertion of universal Market Dojo export compatibility is made.

## One import, first in preview

Run npm run tenders -- import market-dojo --file=imports/bids.csv --map=examples/import-map.json --dry-run --actor="Migration operator". Check row and tender counts. Remove --dry-run to commit the same mapped file. The whole import is one transaction. Duplicate bid rows, inconsistent metadata or changed repeated sources cause rollback. Repeating an identical source is a no-op, even with reordered rows.

Compare every lot quantity, supplier count, unit price and currency with the export. Imported tenders start as drafts with no panel, criteria, scores or approval. Receipt dates and lead times stay null; they are not guessed from the closing date.

Use set-owner to name the accountable owner. Use reconcile-bid for each supplier and lot to record verified --received=, --lead-days= and --evidence=. Define the actual criteria and panel. Opening an imported historical event is allowed after those checks, then evaluate moves it to the internal evaluation workflow. Late imported bids are flagged and block an award while their supplier remains active. The owner must apply the actual procurement rules, not change dates to remove the check.

## What requires separate work

Supplier documents, access permissions, messages, auction history, scoring assignments, signatures, complete price formulae and historical awards do not carry across in this importer. Preserve original files and reconcile them separately. The base awards one supplier across all lots, and does not optimise split awards, convert currencies or administer live auctions. Map those workflows explicitly before switching operational responsibility.

The internal register can be imported in a day once the export is mapped. Complete replacement depends on your workflows and evidence reconciliation. Keep both systems until the team accepts the counts and decisions. Enterprise DNA handles mapping and additional workflows as part of the customised version.

Export all eleven record sets with npm run tenders -- export --file=exports/tenders.json. Create the exports directory first. The export uses a consistent database snapshot and refuses to overwrite an existing file. Store it privately. It contains bid prices and evaluator information.
