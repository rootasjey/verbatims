# Quote provenance model

The provenance tables are the only source of truth for a quote's authors,
references, and evidence.

```text
quotes
├── quote_attributions (1..n; exactly one primary)
└── quote_sources (0..n; quote-level or attribution-level; at most one primary)
```

## Invariants

- Every quote has at least one attribution.
- An attribution has an author, a reference, or both.
- Every quote has exactly one primary attribution.
- A source may belong to the quote or to one of its attributions. When an
  attribution is set, it must belong to the same quote; database triggers and
  write routes enforce this. Deleting an attribution detaches its sources.
- Sources are optional. A quote has at most one primary source.
- `quote_sources.source_type` retains the existing source-origin label. New
  submissions record the normalized medium separately in `source_medium`. Use `audiovisual`
  when the cited witness is a film, TV episode, or online video; use `transcript` or `document`
  when the cited witness is the transcript/subtitle text or screenplay itself.
- `locator_type` and `locator_value` store an optional page, chapter, or
  timecode within a source. Timecodes are stored as `HH:MM:SS`; `MM:SS` input
  treats its first field as total minutes.

`draft` and `harvested` quotes may use an unverified attribution. `pending` and
`approved` quotes must retain a valid attribution. Approval does not require an
external source, but its attribution must be unambiguous and reviewable.

The quote-level columns `author_id`, `reference_id`, `source_type`, and
`source_url` are legacy compatibility fields. They must not be used by new
write paths and will be removed after all read paths have migrated.

## Write rule

The web and v1 quote-creation endpoints write inline authors/references, the
quote, attributions, sources, tags, and (for v1) its activity record in one
audited D1 batch. A failed statement rolls back the whole batch. Quote
submissions may include up to ten optional sources; the server attaches them to
the primary attribution and stores them with `unverified` status. Direct source
management may attach a source to an attribution or leave it quote-level.

Both creation endpoints accept `Idempotency-Key`, scoped to the submitting user
and paired with a server-computed payload hash. Reusing a key with a different
payload returns `409`. The web form reuses a key for retries of the same payload;
API clients should send a stable key when retrying after a lost response.
Requests without a supplied key receive a generated key, which cannot identify a
later client retry. Import workflows are separate and are not covered by this
quote-submission transaction.

Quote submissions also claim `lower(trim(name))` inside that transaction. The
claim table is seeded with distinct normalized names, so existing duplicate
quotes remain untouched while concurrent new submissions cannot claim the same
active name. Triggers maintain claims when quotes are renamed, rejected, or
deleted.
