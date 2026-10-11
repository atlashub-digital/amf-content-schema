# AMF Content Contracts v0.1

## Core principle

Content, access, commerce and presentation are separate concerns.

A `Publication` describes what the content is. It may reference an access policy, but it does not know how Stripe, XPayments, Supabase or a specific frontend works.

## Publication

A publication may be chapter-first (AtlasHub Editions) or body-first (MyPets Markdown guide).

Supported body sources:

- `markdown-inline`
- `markdown-path`
- `json-path`
- `blocks`

Project-specific metadata belongs under `extensions` until repeated pilot evidence justifies promoting it into the core schema.

## Access

The schema defines why access may be granted, not how money moves.

Modes:

- public
- free-account
- lead-gate
- one-time
- bundle
- pack
- membership
- subscription
- campaign-reward
- manual-grant

## Media

Media metadata is portable and attribution-aware. Rendering decisions remain in Experience Core.

## Versioning

Breaking changes require a new `schemaVersion` and a migration path. v0.x additions should be backwards-compatible whenever possible.
