# Quote provenance model

The provenance tables are the only source of truth for a quote's authors,
references, and evidence.

```text
quotes
└── quote_attributions (1..n; exactly one primary)
    └── quote_sources (0..n; at most one primary)
```

## Invariants

- Every quote has at least one attribution.
- An attribution has an author, a reference, or both.
- Every quote has exactly one primary attribution.
- A source always belongs to an attribution of the same quote.
- Sources are optional. A quote has at most one primary source.

`draft` and `harvested` quotes may use an unverified attribution. `pending` and
`approved` quotes must retain a valid attribution. Approval does not require an
external source, but its attribution must be unambiguous and reviewable.

The quote-level columns `author_id`, `reference_id`, `source_type`, and
`source_url` are legacy compatibility fields. They must not be used by new
write paths and will be removed after all read paths have migrated.

## Write rule

Quote creation and imports must create the quote and its first, primary
attribution in the same transaction. Sources are created only with the ID of
an attribution belonging to that quote.
